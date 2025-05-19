import React, { createContext, useContext, useState, useEffect } from 'react';

const TaskContext = createContext(undefined);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks doit être utilisé à l’intérieur d’un TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des tâches');
      const data = await response.json();
      const mapped = data.map(task => ({
        ...task,
        dueDate: task.due_date
      }));
      setTasks(mapped);
    } catch (error) {
      console.error('Erreur fetchTasks:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) throw new Error('Erreur lors de l’ajout de la tâche');
      await response.json();

      // Attendre un court instant avant de rafraîchir
      setTimeout(() => {
        fetchTasks(); // Recharger les tâches à jour
      }, 1000); // 1 seconde
      return true;
    } catch (error) {
      console.error('Erreur addTask:', error.message);
      return false;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      const updated = await response.json();
      const mapped = { ...updated, dueDate: updated.due_date };
      setTasks(prev => prev.map(t => (t.id === id ? mapped : t)));
    } catch (error) {
      console.error('Erreur updateTask:', error.message);
    }
  };

  const deleteTask = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      console.error('Erreur deleteTask:', error.message);
    }
  };

  const getTasksByStatus = (status) => tasks.filter(task => task.status === status);

  const getTaskById = (id) => tasks.find(task => task.id === id);

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      addTask,
      updateTask,
      deleteTask,
      getTasksByStatus,
      getTaskById,
      fetchTasks
    }}>
      {children}
    </TaskContext.Provider>
  );
};
