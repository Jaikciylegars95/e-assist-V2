import { jwtDecode } from 'jwt-decode';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { createTask, updateTask } from '../services/Taskservice'; // Import corrigé

const TaskForm = ({ onSubmit, onCancel, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('todo');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normaliser la date en format YYYY-MM-DD pour EAT
  const normalizeDate = (dateStr) => {
    if (!dateStr) {
      console.log('Aucune date fournie pour normalisation');
      return '';
    }
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(`Date invalide dans normalizeDate : ${dateStr}`);
        return '';
      }
      const eatDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
      return eatDate.toISOString().substring(0, 10);
    } catch (err) {
      console.warn(`Erreur lors de la normalisation de la date : ${dateStr}`, err);
      return '';
    }
  };

  useEffect(() => {
    if (initialData) {
      console.log('initialData chargé:', initialData);
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'medium');
      setStatus(initialData.status || 'todo');
      setDueDate(normalizeDate(initialData.due_date || initialData.dueDate));
      console.log('dueDate initiale après normalisation:', normalizeDate(initialData.due_date || initialData.dueDate));
    }
  }, [initialData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isSubmitting) {
      console.log('Soumission bloquée : déjà en cours');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token'); // Récupérer le token directement
      if (!token || token.split('.').length !== 3) {
        setError('Token invalide ou manquant.');
        setIsSubmitting(false);
        toast.error('Token invalide ou manquant.');
        return;
      }

      const decodedToken = jwtDecode(token);
      const user_id = decodedToken.id || decodedToken.user_id;

      if (!user_id) {
        setError("ID utilisateur non trouvé dans le token.");
        setIsSubmitting(false);
        toast.error("ID utilisateur non trouvé.");
        return;
      }

      if (!title.trim()) {
        setError('Le titre est requis.');
        setIsSubmitting(false);
        toast.error('Le titre est requis.');
        return;
      }

      const taskData = {
        user_id,
        title: title.trim(),
        description: description.trim() || '',
        priority: priority || 'medium',
        status: status || 'todo',
        due_date: dueDate || null,
      };

      console.log('Données envoyées:', taskData);

      // Appeler createTask ou updateTask selon initialData
      if (initialData && initialData.id) {
        await updateTask(initialData.id, taskData);
      } else {
        await createTask(taskData);
      }

      toast.success(initialData ? 'Tâche mise à jour avec succès ✅' : 'Tâche enregistrée avec succès ✅');
      await onSubmit(taskData); // Appeler onSubmit pour mettre à jour l'état
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Erreur lors de l’enregistrement de la tâche.');
      toast.error('Erreur lors de l’enregistrement de la tâche.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Modifier la tâche' : 'Créer une tâche'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priorité
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="todo">À faire</option>
                <option value="in-progress">En cours</option>
                <option value="completed">Terminée</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date limite
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;