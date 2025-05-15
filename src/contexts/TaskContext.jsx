import React, { createContext, useContext, useState, useEffect } from 'react';

const TaskContext = createContext(undefined);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks doit être utilisé à l’intérieur d’un TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les tâches depuis l'API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Impossible de charger les tâches depuis le serveur.');
        const data = await response.json();
        console.log('Données brutes de l\'API:', JSON.stringify(data, null, 2));
        // Mapper due_date à dueDate
        const mappedTasks = data.map(task => ({
          ...task,
          dueDate: task.due_date
        }));
        setTasks(mappedTasks);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des tâches :', error.message);
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const addTask = async (taskData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d’authentification manquant.');
      }

      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Échec de la création de la tâche.');
      }

      const text = await response.text();
      console.log('Réponse brute du backend (addTask):', text);

      const nouvelleTache = text ? JSON.parse(text) : null;

      if (nouvelleTache) {
        // Mapper due_date à dueDate
        const mappedTask = { ...nouvelleTache, dueDate: nouvelleTache.due_date };
        setTasks(prev => [...prev, mappedTask]);
      } else {
        console.warn('La réponse du backend est vide, tâche ajoutée en base mais pas mise à jour localement.');
      }
    } catch (error) {
      console.error('Erreur lors de l’ajout de la tâche :', error.message);
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

      if (!response.ok) {
        throw new Error('Échec de la mise à jour de la tâche.');
      }

      const tacheModifiee = await response.json();
      // Mapper due_date à dueDate
      const mappedTask = { ...tacheModifiee, dueDate: tacheModifiee.due_date };
      setTasks(prev => prev.map(task => task.id === id ? mappedTask : task));
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error.message);
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

      if (!response.ok) {
        throw new Error('Échec de la suppression de la tâche.');
      }

      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression :', error.message);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getTaskById = (id) => {
    return tasks.find(task => task.id === id);
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      updateTask,
      deleteTask,
      getTasksByStatus,
      getTaskById,
      loading
    }}>
      {children}
    </TaskContext.Provider>
  );
};