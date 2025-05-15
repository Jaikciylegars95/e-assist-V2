import axios from 'axios';

const API_URL = 'http://localhost:3001/api/tasks';

// Récupérer le token depuis localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// 🔹 Créer une tâche
export const createTask = async (taskData) => {
  return axios.post(API_URL, taskData, getAuthHeader());
};

// 🔹 Récupérer toutes les tâches de l'utilisateur
export const getTasks = async () => {
  return axios.get(API_URL, getAuthHeader());
};

// 🔹 Récupérer une tâche par ID
export const getTaskById = async (taskId) => {
  return axios.get(`${API_URL}/${taskId}`, getAuthHeader());
};

// 🔹 Mettre à jour une tâche
export const updateTask = async (taskId, updatedTaskData) => {
  return axios.put(`${API_URL}/${taskId}`, updatedTaskData, getAuthHeader());
};

// 🔹 Supprimer une tâche
export const deleteTask = async (taskId) => {
  return axios.delete(`${API_URL}/${taskId}`, getAuthHeader());
};
