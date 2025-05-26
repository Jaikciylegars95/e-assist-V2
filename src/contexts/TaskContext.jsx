import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getTasks, createTask, updateTask, deleteTask } from '../services/Taskservice';

// Création du contexte pour gérer les tâches
const TaskContext = createContext();

// Hook pour utiliser le contexte des tâches
export const useTasks = () => useContext(TaskContext);

// Fournisseur du contexte des tâches
export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]); // Liste des tâches
  const [loading, setLoading] = useState(false); // État de chargement
  const [error, setError] = useState(null); // État d'erreur

  // Génère un UUID unique pour les tâches
  const generateUUID = () => crypto.randomUUID();

  // Supprime les tâches dupliquées basées sur l'ID ou une clé composite
  const removeDuplicates = (tasks) => {
    const seenIds = new Set();
    const seenKeys = new Map();
    return tasks.filter((t) => {
      if (seenIds.has(t.id)) {
        console.warn('Tâche avec ID dupliqué ignorée :', { id: t.id, titre: t.title, date_échéance: t.due_date });
        return false;
      }
      seenIds.add(t.id);
      const key = `${t.title?.toLowerCase() || ''}|${t.due_date || ''}|${t.user_id || ''}`;
      if (seenKeys.has(key)) {
        console.warn('Tâche avec clé dupliquée ignorée :', { clé: key, tâche: t });
        return false;
      }
      seenKeys.set(key, true);
      return true;
    });
  };

  // Récupère les tâches par statut
  const getTasksByStatus = (status) => {
    return tasks.filter((t) => t.status === status);
  };

  // Normalise une date en ajoutant +3h (EAT) et retourne au format YYYY-MM-DD
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(`Date invalide détectée : ${dateStr}`);
        return null;
      }
      const eatDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
      return eatDate.toISOString().substring(0, 10);
    } catch (err) {
      console.error(`Erreur lors de la normalisation de la date : ${dateStr}`, err);
      return null;
    }
  };

  // Charge les tâches au montage du composant
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getTasks();
        console.log('Réponse API getTasks :', response.data);

        let allTasks = [];
        if (response.data.dueTasks && response.data.completedTasks) {
          allTasks = [...response.data.dueTasks, ...response.data.completedTasks];
        } else if (Array.isArray(response.data.tasks)) {
          allTasks = response.data.tasks;
        } else if (Array.isArray(response.data)) {
          allTasks = response.data;
        } else {
          throw new Error('Structure de réponse API inattendue');
        }

        const normalizedTasks = allTasks.map((t) => ({
          ...t,
          id: t.id || t._id || generateUUID(),
          dueDate: normalizeDate(t.due_date || t.dueDate),
          due_date: normalizeDate(t.due_date || t.dueDate),
          status: t.status || 'todo',
          user_id: t.user_id || t.userId || '',
          createdAt: t.createdAt || new Date().toISOString(),
        }));

        const uniqueTasks = removeDuplicates(normalizedTasks);
        setTasks(uniqueTasks);
        console.log('Tâches normalisées et dédupliquées :', uniqueTasks);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || 'Erreur lors du chargement des tâches';
        setError(errorMessage);
        console.error('Erreur lors du chargement des tâches :', error);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Ajoute une nouvelle tâche
  const addTask = async (taskData) => {
    const isDuplicate = tasks.some(
      (t) =>
        t.title.toLowerCase() === taskData.title.toLowerCase() &&
        (t.due_date || '') === (taskData.due_date || '') &&
        t.user_id === taskData.user_id
    );
    if (isDuplicate) {
      console.warn('Tâche dupliquée détectée :', taskData);
      toast.warn('Une tâche avec ce titre et cette date existe déjà.');
      return false;
    }

    const newTask = {
      ...taskData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await createTask(newTask);
      console.log('Réponse API ajout tâche :', response.data);
      const savedTask = response.data.task
        ? {
            ...response.data.task,
            id: response.data.task.id || response.data.task._id || newTask.id,
            dueDate: normalizeDate(response.data.task.due_date || response.data.task.dueDate),
            due_date: normalizeDate(response.data.task.due_date || response.data.task.dueDate),
            status: response.data.task.status || 'todo',
            user_id: response.data.task.user_id || newTask.user_id,
            createdAt: response.data.task.createdAt || newTask.createdAt,
          }
        : {
            ...response.data,
            id: response.data.id || response.data._id || newTask.id,
            dueDate: normalizeDate(response.data.due_date || response.data.dueDate),
            due_date: normalizeDate(response.data.due_date || response.data.dueDate),
            status: response.data.status || 'todo',
            user_id: response.data.user_id || newTask.user_id,
            createdAt: response.data.createdAt || newTask.createdAt,
          };
      setTasks((prevTasks) => removeDuplicates([...prevTasks, savedTask]));
      console.log('Tâche ajoutée :', savedTask);
      toast.success('Tâche ajoutée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l’ajout de la tâche :', error.response?.data || error);
      setError(error.response?.data?.error || 'Erreur lors de l’ajout de la tâche');
      toast.error(error.response?.data?.error || 'Erreur lors de l’ajout de la tâche');
      return false;
    }
  };

  // Met à jour une tâche par ID
  const updateTaskById = async (id, taskData) => {
    console.log('Mise à jour de la tâche avec ID :', id, 'Données :', taskData);
    try {
      const normalizedTaskData = {
        ...taskData,
        due_date: normalizeDate(taskData.dueDate || taskData.due_date),
      };
      delete normalizedTaskData.dueDate;
      const response = await updateTask(id, normalizedTaskData);
      console.log('Réponse API mise à jour tâche :', response.data);

      const updatedTask = response.data.task
        ? {
            ...response.data.task,
            id: id, // Force l'ID à rester le même
            dueDate: normalizeDate(response.data.task.due_date || response.data.task.dueDate),
            due_date: normalizeDate(response.data.task.due_date || response.data.task.dueDate),
            status: response.data.task.status || 'todo',
            user_id: response.data.task.user_id || taskData.user_id,
            createdAt: response.data.task.createdAt || taskData.createdAt || new Date().toISOString(),
          }
        : {
            ...response.data,
            id: id, // Force l'ID à rester le même
            dueDate: normalizeDate(response.data.due_date || response.data.dueDate),
            due_date: normalizeDate(response.data.due_date || response.data.dueDate),
            status: response.data.status || 'todo',
            user_id: response.data.user_id || taskData.user_id,
            createdAt: response.data.createdAt || taskData.createdAt || new Date().toISOString(),
          };

      setTasks((prevTasks) => {
        const newTasks = prevTasks.map((t) => (t.id === id ? updatedTask : t));
        const uniqueTasks = removeDuplicates(newTasks);
        console.log('Tâches après mise à jour :', uniqueTasks);
        return uniqueTasks;
      });
      toast.success('Tâche mise à jour avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche :', error.response?.data || error);
      setError(error.response?.data?.error || 'Erreur lors de la mise à jour de la tâche');
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour de la tâche');
      return false;
    }
  };

  // Supprime une tâche par ID
  const deleteTaskById = async (id) => {
    console.log('Suppression de la tâche avec ID :', id);
    try {
      const response = await deleteTask(id);
      console.log('Réponse API suppression tâche :', response.data);
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
      toast.success('Tâche supprimée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche :', error.response?.data || error);
      setError(error.response?.data?.error || 'Erreur lors de la suppression de la tâche');
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression de la tâche');
      return false;
    }
  };

  return (
    <TaskContext.Provider
      value={{ tasks, addTask, updateTask: updateTaskById, deleteTask: deleteTaskById, getTasksByStatus, loading, error }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider;