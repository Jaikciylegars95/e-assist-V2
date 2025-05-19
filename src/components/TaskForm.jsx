import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getToken } from '../services/authService';
import { toast } from 'react-toastify';

const TaskForm = ({ onSubmit, onCancel, initialData, setTasks }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('todo');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'medium');
      setStatus(initialData.status || 'todo');
      if (initialData.dueDate) {
        setDueDate(initialData.dueDate.substring(0, 10));
      }
    }
  }, [initialData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (isSubmitting) return;
    setIsSubmitting(true);

    const token = getToken();
    if (!token || token.split('.').length !== 3) {
      setError('Token invalide ou manquant.');
      setIsSubmitting(false);
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const user_id = decodedToken.id || decodedToken.user_id;

      if (!user_id) {
        setError("ID utilisateur non trouvé dans le token.");
        setIsSubmitting(false);
        return;
      }

      const taskData = {
        user_id,
        title,
        description,
        priority,
        status,
        due_date: dueDate,
      };

      let response;
      const taskId = initialData?._id || initialData?.id;

      if (taskId) {
        response = await axios.put(`http://localhost:3001/api/tasks/${taskId}`, taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Tâche mise à jour avec succès ✅');
      } else {
        response = await axios.post('http://localhost:3001/api/tasks', taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Tâche enregistrée avec succès ✅');
      }

      // Mise à jour de la liste sans rechargement
      if (setTasks) {
        setTasks((prevTasks) => {
          if (taskId) {
            return prevTasks.map((task) =>
              task._id === response.data._id || task.id === response.data.id ? response.data : task
            );
          } else {
            return [response.data, ...prevTasks];
          }
        });
      }

      if (onSubmit) onSubmit(response.data);
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement :', error.message || error);
      toast.error("Une erreur est survenue lors de l'enregistrement de la tâche.");
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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
