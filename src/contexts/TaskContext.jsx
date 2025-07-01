import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getTasks, createTask, updateTask, deleteTask } from '../services/Taskservice';

// Création du contexte pour gérer les tâches
const TaskContext = createContext();

// Hook pour utiliser le contexte des tâches
export const useTasks = () => useContext(TaskContext);

// Fournisseur du contexte des tâches
export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Génère un UUID unique pour les tâches
  const generateUUID = () => crypto.randomUUID();

  // Supprime les tâches dupliquées basées sur l'ID
  const removeDuplicates = (tasks) => {
    const seenIds = new Set();
    return tasks.filter((t) => {
      if (seenIds.has(t.id)) {
        console.warn('Tâche avec ID dupliqué ignorée:', { id: t.id, title: t.title, due_date: t.due_date });
        return false;
      }
      seenIds.add(t.id);
      return true;
    });
  };

  // Récupère les tâches par statut
  const getTasksByStatus = (status) => {
    return tasks.filter((t) => t.status === status);
  };

  // Normalise une date au format YYYY-MM-DD
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(`Date invalide détectée : ${dateStr}`);
        return null;
      }
      return date.toISOString().substring(0, 10);
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
        const tasks = await getTasks();
        console.log('Réponse API getTasks:', tasks);

        if (!Array.isArray(tasks)) {
          console.error('Structure de réponse inattendue:', tasks);
          throw new Error('Structure de réponse API inattendue: tableau attendu');
        }

        const normalizedTasks = tasks.map((t) => ({
          ...t,
          id: t.id || t._id || generateUUID(),
          due_date: normalizeDate(t.due_date || t.dueDate),
          status: t.status || 'todo',
          user_id: t.user_id || t.userId || '',
          created_at: t.created_at || t.createdAt || new Date().toISOString(),
        }));

        const uniqueTasks = removeDuplicates(normalizedTasks);
        setTasks(uniqueTasks);
        console.log('Tâches normalisées et dédupliquées:', uniqueTasks);
      } catch (error) {
        const errorMessage = error.message || 'Erreur lors du chargement des tâches';
        setError(errorMessage);
        console.error('Erreur lors du chargement des tâches:', error);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Ajoute une nouvelle tâche
  const addTask = async (taskData) => {
    const newTask = {
      ...taskData,
      status: taskData.status === 'in_progress' ? 'in-progress' : taskData.status,
      created_at: new Date().toISOString(),
    };

    try {
      const savedTaskData = await createTask(newTask);
      console.log('Réponse API ajout tâche:', savedTaskData);
      const savedTask = {
        ...savedTaskData,
        id: savedTaskData.id || savedTaskData._id,
        due_date: normalizeDate(savedTaskData.due_date || savedTaskData.dueDate),
        status: savedTaskData.status || 'todo',
        user_id: savedTaskData.user_id || newTask.user_id,
        created_at: savedTaskData.created_at || newTask.created_at,
      };
      setTasks((prevTasks) => removeDuplicates([...prevTasks, savedTask]));
      console.log('Tâche ajoutée:', savedTask);
      toast.success('Tâche ajoutée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l’ajout de la tâche:', error);
      const errorMessage = error.message || 'Erreur lors de l’ajout de la tâche';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  // Met à jour une tâche par ID
  const updateTaskById = async (id, taskData) => {
    console.log('Mise à jour de la tâche avec ID:', id, 'Données:', taskData);
    try {
      const normalizedTaskData = {
        ...taskData,
        status: taskData.status === 'in_progress' ? 'in-progress' : taskData.status,
        due_date: normalizeDate(taskData.due_date || taskData.dueDate),
      };
      const updatedTaskData = await updateTask(id, normalizedTaskData);
      console.log('Réponse API mise à jour tâche:', updatedTaskData);

      const updatedTask = {
        ...updatedTaskData,
        id: id,
        due_date: normalizeDate(updatedTaskData.due_date || updatedTaskData.dueDate),
        status: updatedTaskData.status || 'todo',
        user_id: updatedTaskData.user_id || taskData.user_id,
        created_at: updatedTaskData.created_at || taskData.created_at || new Date().toISOString(),
      };

      setTasks((prevTasks) => {
        const newTasks = prevTasks.map((t) => (t.id === id ? updatedTask : t));
        const uniqueTasks = removeDuplicates(newTasks);
        console.log('Tâches après mise à jour:', uniqueTasks);
        return uniqueTasks;
      });
      toast.success('Tâche mise à jour avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      setError(error.message || 'Erreur lors de la mise à jour de la tâche');
      toast.error(error.message || 'Erreur lors de la mise à jour de la tâche');
      return false;
    }
  };

  // Supprime une tâche par ID
  const deleteTaskById = async (id) => {
    console.log('Suppression de la tâche avec ID:', id);
    try {
      const response = await deleteTask(id);
      console.log('Réponse API suppression tâche:', response);
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
      toast.success('Tâche supprimée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche:', error);
      setError(error.message || 'Erreur lors de la suppression de la tâche');
      toast.error(error.message || 'Erreur lors de la suppression de la tâche');
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