import { jwtDecode } from 'jwt-decode';  // Import nommé obligatoire avec la dernière version
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getToken } from '../services/authService'; // Vérifie que ce chemin est correct

const TaskForm = ({ onSubmit, onCancel, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('todo');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'medium');
      setStatus(initialData.status || 'todo');
      if (initialData.dueDate) {
        setDueDate(initialData.dueDate);
      }
    }
  }, [initialData]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getToken();
    console.log("Token récupéré: ", token);
    console.log(localStorage.getItem('token'));

    if (!token || token.split('.').length !== 3) {
      setError('Token invalide ou manquant.');
      console.error('Token invalide ou manquant.');
      return;
    }

    try {
      const decodedToken = jwtDecode(token); // Utilisation correcte avec l’export nommé
      const user_id = decodedToken.id || decodedToken.user_id;

      if (!user_id) {
        setError('ID utilisateur non trouvé dans le token.');
        console.error('ID utilisateur non trouvé dans le token.');
        return;
      }

      const response = await axios.post(
        'http://localhost:3001/api/tasks',
        {
          user_id,
          title,
          description,
          priority,
          status,
          due_date: dueDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Réponse du backend:', response.data);
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error('Erreur lors de l/’envoi au backend:', error.message || error);
      setError('Une erreur est survenue lors de l/’envoi de la tâche.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
          {/* Champs du formulaire */}
          {/* Champ titre */}
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

          {/* Champ description */}
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

          {/* Priorité et Statut */}
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

          {/* Date limite */}
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

          {/* Erreur */}
          {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

          {/* Boutons */}
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {initialData ? 'Mettre à jour la tâche' : 'Créer la tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
