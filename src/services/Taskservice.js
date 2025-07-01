import axios from 'axios';

const API_URL = 'http://localhost:3001/api/tasks';
const TEAM_LEADER_API_URL = 'http://localhost:3001/api/TeamLeader/tasks';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Aucun token trouvé dans localStorage');
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getTasks = async () => {
  console.log('Fetching tasks from:', API_URL);
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders(),
    });
    console.log('Raw response from getTasks:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur getTasks:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    if (error.response?.status === 401) {
      throw new Error('Token invalide');
    }
    throw error;
  }
};

export const createTask = async (taskData) => {
  console.log('Creating task at:', API_URL, 'with data:', taskData);
  // Validation des données avant envoi
  if (!taskData.user_id || !taskData.title || !taskData.priority || !taskData.status || !taskData.assigned_by) {
    console.error('Données invalides pour createTask:', taskData);
    throw new Error('Données requises manquantes (user_id, title, priority, status, assigned_by)');
  }
  try {
    const response = await axios.post(API_URL, taskData, {
      headers: getAuthHeaders(),
    });
    console.log('Raw response from createTask:', {
      data: response.data,
      status: response.status,
      user_id_sent: taskData.user_id,
      user_id_received: response.data.user_id,
    });
    if (!response.data.id) {
      console.error('Aucun ID de tâche renvoyé, insertion probablement échouée');
      throw new Error('Tâche non créée, aucun ID renvoyé');
    }
    return response.data;
  } catch (error) {
    console.error('Erreur createTask:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      requestData: taskData,
    });
    if (error.response?.status === 401) {
      throw new Error('Token invalide');
    }
    throw new Error(error.response?.data?.error || 'Erreur lors de la création de la tâche');
  }
};

export const createTaskForUser = async (taskData) => {
  console.log('Creating task for user at:', TEAM_LEADER_API_URL, 'with data:', taskData);
  // Validation des données avant envoi
  if (!taskData.user_id || !taskData.title || !taskData.priority || !taskData.status || !taskData.assigned_by) {
    console.error('Données invalides pour createTaskForUser:', taskData);
    throw new Error('Données requises manquantes (user_id, title, priority, status, assigned_by)');
  }
  try {
    const response = await axios.post(TEAM_LEADER_API_URL, taskData, {
      headers: getAuthHeaders(),
    });
    console.log('Raw response from createTaskForUser:', {
      data: response.data,
      status: response.status,
      user_id_sent: taskData.user_id,
      user_id_received: response.data.user_id,
    });
    if (!response.data.id) {
      console.error('Aucun ID de tâche renvoyé, insertion probablement échouée');
      throw new Error('Tâche non créée, aucun ID renvoyé');
    }
    if (response.data.user_id !== taskData.user_id) {
      console.warn('Avertissement: user_id incohérent', {
        expected: taskData.user_id,
        received: response.data.user_id,
      });
    }
    return response.data;
  } catch (error) {
    console.error('Erreur createTaskForUser:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      requestData: taskData,
    });
    if (error.response?.status === 401) {
      throw new Error('Token invalide');
    }
    throw new Error(error.response?.data?.error || 'Erreur lors de l\'assignation de la tâche');
  }
};

export const updateTask = async (taskId, taskData) => {
  console.log('Updating task at:', `${API_URL}/${taskId}`, 'with data:', taskData);
  try {
    const response = await axios.put(`${API_URL}/${taskId}`, taskData, {
      headers: getAuthHeaders(),
    });
    console.log('Raw response from updateTask:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur updateTask:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    if (error.response?.status === 401) {
      throw new Error('Token invalide');
    }
    throw new Error(error.response?.data?.error || 'Erreur lors de la mise à jour de la tâche');
  }
};

export const deleteTask = async (taskId) => {
  console.log('Deleting task at:', `${API_URL}/${taskId}`);
  try {
    const response = await axios.delete(`${API_URL}/${taskId}`, {
      headers: getAuthHeaders(),
    });
    console.log('Raw response from deleteTask:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteTask:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    if (error.response?.status === 401) {
      throw new Error('Token invalide');
    }
    throw new Error(error.response?.data?.error || 'Erreur lors de la suppression de la tâche');
  }
};