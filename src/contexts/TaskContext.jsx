import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getTasks, createTask, updateTask, deleteTask } from '../services/Taskservice'; // Import corrigé

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateUUID = () => crypto.randomUUID();

  const removeDuplicates = (tasks) => {
    const seen = new Map();
    return tasks.filter((t) => {
      const key = `${t.title.toLowerCase()}|${t.due_date || ''}|${t.user_id || ''}`;
      if (seen.has(key)) {
        console.warn(`Tâche dupliquée ignorée : ${t.title} (ID: ${t.id})`);
        return false;
      }
      seen.set(key, true);
      return true;
    });
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((t) => t.status === status);
  };

  const normalizeDate = (dateStr) => {
    if (!dateStr) {
      console.warn('Date absente');
      return null;
    }
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

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getTasks();
        console.log('Réponse API brute (fetchTasks):', response.data);

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

        const normalizedTasks = allTasks.map((t) => {
          const normalizedTask = {
            ...t,
            id: t.id || t._id || generateUUID(),
            dueDate: normalizeDate(t.due_date || t.dueDate),
            due_date: normalizeDate(t.due_date || t.dueDate),
            status: t.status || 'todo',
            user_id: t.user_id || t.userId || '',
          };
          console.log('Tâche normalisée (fetchTasks):', normalizedTask);
          return normalizedTask;
        });

        const uniqueTasks = removeDuplicates(normalizedTasks);
        setTasks(uniqueTasks);
        console.log('Tâches normalisées (fetchTasks):', uniqueTasks);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || 'Erreur lors du chargement des tâches';
        setError(errorMessage);
        console.error('Erreur lors du chargement des tâches:', error);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const addTask = async (taskData) => {
    console.log('addTask appelé avec:', taskData);

    const isDuplicate = tasks.some(
      (t) =>
        t.title.toLowerCase() === taskData.title.toLowerCase() &&
        (t.due_date || '') === (taskData.due_date || '') &&
        t.user_id === taskData.user_id
    );
    if (isDuplicate) {
      console.warn('Tâche dupliquée détectée:', taskData);
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
      console.log('Réponse ajout tâche:', response.data);
      const savedTask = response.data.task
        ? {
            ...response.data.task,
            id: response.data.task.id || response.data.task._id || newTask.id,
            dueDate: normalizeDate(response.data.task.due_date || response.data.task.dueDate),
            due_date: normalizeDate(response.data.task.due_date || response.data.task.dueDate),
            status: response.data.task.status || 'todo',
            user_id: response.data.task.user_id || newTask.user_id,
          }
        : {
            ...response.data,
            id: response.data.id || response.data._id || newTask.id,
            dueDate: normalizeDate(response.data.due_date || response.data.dueDate),
            due_date: normalizeDate(response.data.due_date || response.data.dueDate),
            status: response.data.status || 'todo',
            user_id: response.data.user_id || newTask.user_id,
          };
      setTasks((prevTasks) => removeDuplicates([...prevTasks, savedTask]));
      console.log('Tâche ajoutée:', savedTask);
      return true;
    } catch (error) {
      console.error('Erreur lors de l’ajout de la tâche:', error.response?.data || error);
      setError(error.response?.data?.error || 'Erreur lors de l’ajout de la tâche');
      toast.error(error.response?.data?.error || 'Erreur lors de l’ajout de la tâche');
      return false;
    }
  };

  const updateTaskById = async (id, taskData) => {
    console.log('updateTask appelé avec ID:', id, 'data:', taskData);
    try {
      const response = await updateTask(id, taskData);
      console.log('Réponse mise à jour tâche:', response.data);
      const updatedTask = response.data.task
        ? {
            ...response.data.task,
            id: response.data.task.id || response.data.task._id || id,
            dueDate: normalizeDate(response.data.task.due_date || response.data.task.dueDate),
            due_date: normalizeDate(response.data.task.due_date || response.data.task.dueDate),
            status: response.data.task.status || 'todo',
            user_id: response.data.task.user_id || taskData.user_id,
          }
        : {
            ...response.data,
            id: response.data.id || response.data._id || id,
            dueDate: normalizeDate(response.data.due_date || response.data.dueDate),
            due_date: normalizeDate(response.data.due_date || response.data.dueDate),
            status: response.data.status || 'todo',
            user_id: response.data.user_id || taskData.user_id,
          };
      setTasks((prevTasks) =>
        removeDuplicates(prevTasks.map((t) => (t.id === id ? updatedTask : t)))
      );
      console.log('Tâche mise à jour:', updatedTask);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error.response?.data || error);
      setError(error.response?.data?.error || 'Erreur lors de la mise à jour de la tâche.');
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour de la tâche.');
      return false;
    }
  };

  const deleteTaskById = async (id) => {
    console.log('deleteTask appelé avec ID:', id);
    try {
      const response = await deleteTask(id);
      console.log('Réponse suppression tâche:', response.data);
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
      toast.success('Tâche supprimée avec succès ✅');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche:', error.response?.data || error);
      setError(error.response?.data?.error || 'Erreur lors de la suppression de la tâche.');
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression de la tâche.');
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