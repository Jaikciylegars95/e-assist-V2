import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Eye, Edit } from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';
import axios from 'axios';
import { createTaskForUser, createTask } from '../services/Taskservice';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTH_API_URL = `${BASE_API_URL}/auth`;
const TEAM_LEADER_API_URL = `${BASE_API_URL}/TeamLeader`;

const TeamLeaderPage = () => {
  const { tasks, addTask, updateTask, deleteTask, loading, error: taskError } = useTasks();
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [newMember, setNewMember] = useState({ nom: '', prenom: '', email: '', password: '' });
  const [newTask, setNewTask] = useState({
    user_id: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    assigned_by: '',
  });
  const [editTask, setEditTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const validateEmail = (email) => email.trim() !== '';
  const validateDate = (date) => !date || !isNaN(Date.parse(date));
  const validatePriority = (priority) => ['low', 'medium', 'high'].includes(priority);
  const validateStatus = (status) => ['todo', 'in-progress', 'completed'].includes(status);

  const getDisplayName = (prenom, nom, id, fallback = 'Non identifié') => {
    if (prenom || nom) return `${prenom || ''} ${nom || ''}`.trim();
    console.warn(`Nom/prénom manquant pour ID: ${id}`);
    return fallback;
  };

  useEffect(() => {
    const verifyUser = async () => {
      try {
        if (!token) throw new Error('Aucun token trouvé.');
        const res = await axios.get(`${AUTH_API_URL}/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        console.log('Utilisateur vérifié:', res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur lors de la vérification de l’utilisateur');
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    verifyUser();
  }, [navigate, token]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get(`${TEAM_LEADER_API_URL}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(res.data);
        console.log('Membres récupérés:', res.data);
      } catch (err) {
        const errorMessage =
          err.response?.status === 500
            ? err.response?.data?.error || 'Erreur serveur lors de la récupération des membres.'
            : err.response?.status === 404
            ? 'Service de récupération des membres indisponible'
            : err.response?.data?.error || 'Erreur lors de la récupération des membres';
        console.error('Erreur fetchMembers:', err);
        setError(errorMessage);
      }
    };

    const fetchTeamLeaders = async () => {
      try {
        const res = await axios.get(`${TEAM_LEADER_API_URL}/team-leaders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamLeaders(res.data);
        console.log('Team Leaders récupérés:', res.data);
      } catch (err) {
        console.error('Erreur fetchTeamLeaders:', err);
        setError('Erreur lors de la récupération des team leaders');
      }
    };

    const fetchTasks = async () => {
      try {
        const res = await axios.get(`${TEAM_LEADER_API_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamTasks(res.data);
        console.log('Tâches de l\'équipe récupérées:', res.data);
      } catch (err) {
        console.error('Erreur fetchTasks:', err);
        setError('Erreur lors de la récupération des tâches de l\'équipe');
      }
    };

    if (user?.role === 'team_leader') {
      fetchMembers();
      fetchTeamLeaders();
      fetchTasks();
    }
  }, [user, token]);

  useEffect(() => {
    console.log('Tâches actuelles (TaskContext):', tasks);
    console.log('Tâches de l\'équipe (teamTasks):', teamTasks);
  }, [tasks, teamTasks]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const cleanedEmail = newMember.email.trim().toLowerCase();
    if (!newMember.nom.trim()) {
      setError('Le nom est requis.');
      return;
    }
    if (!validateEmail(cleanedEmail)) {
      setError('Email ne peut pas être vide.');
      return;
    }
    if (!newMember.password.trim()) {
      setError('Le mot de passe est requis.');
      return;
    }
    try {
      const res = await axios.post(
        `${TEAM_LEADER_API_URL}/members`,
        { ...newMember, email: cleanedEmail },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMembers([...members, res.data]);
      setNewMember({ nom: '', prenom: '', email: '', password: '' });
      setSuccess('Membre ajouté avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage =
        err.response?.status === 500
          ? err.response?.data?.error || 'Erreur serveur lors de l’ajout du membre.'
          : err.response?.status === 404
          ? 'Service d’ajout de membres indisponible'
          : err.response?.status === 409
          ? 'Cet email est déjà utilisé.'
          : err.response?.data?.error || 'Erreur lors de l’ajout du membre';
      console.error('Erreur handleAddMember:', err);
      setError(errorMessage);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Supprimer ce membre ?')) return;
    setError('');
    setSuccess('');
    try {
      await axios.delete(`${TEAM_LEADER_API_URL}/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(members.filter((m) => m.id !== id));
      setSuccess('Membre supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage =
        err.response?.status === 500
          ? err.response?.data?.error || 'Erreur serveur lors de la suppression du membre.'
          : err.response?.status === 404
          ? 'Service de suppression de membres indisponible'
          : err.response?.data?.error || 'Erreur lors de la suppression du membre';
      console.error('Erreur handleDeleteMember:', err);
      setError(errorMessage);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    let taskData;

    if (!newTask.title.trim()) {
      setError('Le titre est requis.');
      console.error('Erreur: titre manquant', { title: newTask.title });
      return;
    }
    if (!validatePriority(newTask.priority)) {
      setError('Priorité invalide.');
      console.error('Erreur: priorité invalide', { priority: newTask.priority });
      return;
    }
    if (!validateStatus(newTask.status)) {
      setError('Statut invalide.');
      console.error('Erreur: statut invalide', { status: newTask.status });
      return;
    }
    if (!validateDate(newTask.due_date)) {
      setError('Date invalide.');
      console.error('Erreur: date invalide', { due_date: newTask.due_date });
      return;
    }

    try {
      if (user?.role === 'team_leader') {
        if (!newTask.user_id) {
          setError('Sélectionnez un membre à assigner.');
          console.error('Erreur: user_id manquant', { user_id: newTask.user_id });
          return;
        }
        if (!newTask.assigned_by) {
          setError('Sélectionnez un assignateur.');
          console.error('Erreur: assigned_by manquant', { assigned_by: newTask.assigned_by });
          return;
        }
        const selectedMember = members.find((m) => m.id.toString() === newTask.user_id.toString());
        if (!selectedMember) {
          setError('Membre sélectionné invalide.');
          console.error('Erreur: membre non trouvé', { user_id: newTask.user_id, members });
          return;
        }
        const selectedTeamLeader = teamLeaders.find((tl) => tl.id.toString() === newTask.assigned_by.toString());
        if (!selectedTeamLeader) {
          setError('Assignateur sélectionné invalide.');
          console.error('Erreur: assignateur non trouvé', { assigned_by: newTask.assigned_by, teamLeaders });
          return;
        }
        taskData = {
          user_id: parseInt(newTask.user_id),
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          priority: newTask.priority,
          status: newTask.status,
          due_date: newTask.due_date || null,
          assigned_by: parseInt(newTask.assigned_by),
        };
        console.log('Assignation de tâche via TeamLeader:', {
          taskData,
          selected_user_id: newTask.user_id,
          team_leader_id: user.id,
          selected_member: selectedMember,
        });
        const response = await createTaskForUser(taskData);
        console.log('Réponse createTaskForUser:', response);
        if (!response.id) {
          throw new Error('Tâche non créée, aucun ID renvoyé');
        }
        const newTaskData = {
          ...response,
          user_id: parseInt(newTask.user_id),
          user_prenom: selectedMember.prenom,
          user_nom: selectedMember.nom,
          assigned_by_prenom: selectedTeamLeader.prenom,
          assigned_by_nom: selectedTeamLeader.nom,
        };
        addTask(newTaskData);
        setTeamTasks([...teamTasks, newTaskData]);
      } else {
        if (!user?.id) {
          setError('Utilisateur non identifié.');
          console.error('Erreur: user.id manquant', { user });
          return;
        }
        taskData = {
          user_id: user.id,
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          priority: newTask.priority,
          status: newTask.status,
          due_date: newTask.due_date || null,
          assigned_by: user.id,
        };
        console.log('Création de tâche pour utilisateur simple:', taskData);
        const response = await createTask(taskData);
        console.log('Réponse createTask:', response);
        if (!response.id) {
          throw new Error('Tâche non créée, aucun ID renvoyé');
        }
        const newTaskData = {
          ...response,
          user_prenom: user.prenom,
          user_nom: user.nom,
          assigned_by_prenom: user.prenom,
          assigned_by_nom: user.nom,
        };
        addTask(newTaskData);
        setTeamTasks([...teamTasks, newTaskData]);
      }
      setNewTask({
        user_id: '',
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        assigned_by: '',
      });
      setSuccess('Tâche ajoutée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Erreur lors de l’ajout de la tâche';
      console.error('Erreur handleAddTask:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        taskData,
      });
      setError(errorMessage);
    }
  };

  const handleViewTask = (task) => {
    setViewTask(task);
  };

  const handleEditTask = (task) => {
    setEditTask({
      id: task.id,
      user_id: task.user_id?.toString() || '',
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assigned_by: task.assigned_by?.toString() || '',
    });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (user?.role === 'team_leader' && (!editTask.user_id || !editTask.assigned_by)) {
      setError('Sélectionnez un membre et un assignateur.');
      return;
    }
    if (!editTask.title.trim()) {
      setError('Le titre est requis.');
      return;
    }
    if (!validatePriority(editTask.priority)) {
      setError('Priorité invalide.');
      return;
    }
    if (!validateStatus(editTask.status)) {
      setError('Statut invalide.');
      return;
    }
    if (!validateDate(editTask.due_date)) {
      setError('Date invalide.');
      return;
    }
    try {
      const taskData =
        user?.role === 'user'
          ? {
              ...editTask,
              user_id: user.id,
              assigned_by: user.id,
            }
          : {
              ...editTask,
              user_id: parseInt(editTask.user_id),
              assigned_by: parseInt(editTask.assigned_by),
            };
      const response = await updateTask(editTask.id, taskData);
      const selectedMember = members.find((m) => m.id.toString() === editTask.user_id?.toString());
      const selectedTeamLeader = teamLeaders.find((tl) => tl.id.toString() === editTask.assigned_by?.toString());
      const updatedTaskData = {
        ...response,
        user_id: parseInt(editTask.user_id) || user.id,
        user_prenom: selectedMember?.prenom || user.prenom,
        user_nom: selectedMember?.nom || user.nom,
        assigned_by_prenom: selectedTeamLeader?.prenom || user.prenom,
        assigned_by_nom: selectedTeamLeader?.nom || user.nom,
      };
      addTask(updatedTaskData);
      setTeamTasks(teamTasks.map((t) => (t.id === editTask.id ? updatedTaskData : t)));
      setEditTask(null);
      setSuccess('Tâche mise à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de la mise à jour de la tâche';
      console.error('Erreur handleUpdateTask:', err);
      setError(errorMessage);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    try {
      await deleteTask(id);
      setTeamTasks(teamTasks.filter((t) => t.id !== id));
      setSuccess('Tâche supprimée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de la suppression de la tâche';
      console.error('Erreur handleDeleteTask:', err);
      setError(errorMessage);
    }
  };

  const tasksByUser = members.reduce((acc, member) => {
    if (member.id) {
      const memberTasks = teamTasks.filter((task) => {
        const matches = task.user_id && task.user_id.toString() === member.id.toString();
        if (matches) {
          console.log(`Tâche assignée à ${member.prenom} ${member.nom} (ID: ${member.id}):`, task);
        }
        return matches;
      });
      acc[member.id] = {
        id: member.id,
        nom: member.nom || '',
        prenom: member.prenom || '',
        tasks: memberTasks,
      };
      console.log(`Tâches regroupées pour ${member.prenom} ${member.nom} (ID: ${member.id}):`, memberTasks);
    }
    return acc;
  }, {});

  if (loading) return <div className="p-4 text-center text-gray-600 dark:text-gray-300">Chargement...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto bg-gray-100 dark:bg-gray-900 min-h-screen transition-all duration-300">
      <header className="mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bienvenue, {user?.prenom || ''} {user?.nom || ''}
        </p>
      </header>

      {(success || taskError || error) && (
        <div
          className={`mb-6 p-4 rounded-lg shadow-md ${
            success
              ? 'bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100'
              : 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100'
          } transition-all duration-200`}
        >
          {success || taskError || error}
        </div>
      )}

      {user?.role === 'team_leader' && (
        <>
          <section className="mb-12 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Ajouter un membre</h2>
            <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
                <input
                  type="text"
                  value={newMember.nom}
                  onChange={(e) => setNewMember({ ...newMember, nom: e.target.value })}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
                <input
                  type="text"
                  value={newMember.prenom}
                  onChange={(e) => setNewMember({ ...newMember, prenom: e.target.value })}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe</label>
                <input
                  type="password"
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center space-x-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <PlusCircle size={18} />
                  <span>Ajouter membre</span>
                </button>
              </div>
            </form>
          </section>

          <section className="mb-12 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Membres de l'équipe</h2>
            {members.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Aucun membre.</p>
            ) : (
              <ul className="space-y-3">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={member.profilePicture || 'https://placehold.co/50x50'}
                        alt="Profile"
                        className="w-10 h-10 rounded-full"
                      />
                      <span className="text-gray-800 dark:text-gray-100">
                        {member.prenom} {member.nom} ({member.email})
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="mb-12 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl transition-all duration-300">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Ajouter une tâche</h2>
        <form onSubmit={handleAddTask} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user?.role === 'team_leader' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Membre</label>
                <select
                  value={newTask.user_id}
                  onChange={(e) => {
                    console.log('Membre sélectionné:', e.target.value);
                    setNewTask({ ...newTask, user_id: e.target.value });
                  }}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner un membre</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id.toString()}>
                      {member.prenom} {member.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignée par</label>
                <select
                  value={newTask.assigned_by}
                  onChange={(e) => {
                    console.log('Assignateur sélectionné:', e.target.value);
                    setNewTask({ ...newTask, assigned_by: e.target.value });
                  }}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner un assignateur</option>
                  {teamLeaders.map((leader) => (
                    <option key={leader.id} value={leader.id.toString()}>
                      {leader.prenom} {leader.nom}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priorité</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
              required
            >
              <option value="low">Faible</option>
              <option value="medium">Modéré</option>
              <option value="high">Ultra</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
            <select
              value={newTask.status}
              onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
              className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
              required
            >
              <option value="todo">À faire</option>
              <option value="in-progress">En cours</option>
              <option value="completed">Terminé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date d'échéance</label>
            <input
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center space-x-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <PlusCircle size={18} />
              <span>Ajouter tâche</span>
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl transition-all duration-300">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Tâches assignées par membre</h2>
        {user?.role === 'user' ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-4">Vos tâches</h3>
            {tasks.filter((task) => task.user_id && task.user_id.toString() === user?.id.toString()).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Aucune tâche assignée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="p-3 rounded-tl-lg">ID</th>
                      <th className="p-3 text-center">Utilisateur</th>
                      <th className="p-3 text-center">Titre</th>
                      <th className="p-3 text-center">Description</th>
                      <th className="p-3 text-center">Priorité</th>
                      <th className="p-3 text-center min-w-[120px]">Statut</th>
                      <th className="p-3 text-center">Échéance</th>
                      <th className="p-3 text-center">Assigné par</th>
                      <th className="p-3 rounded-tr-lg text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .filter((task) => task.user_id && task.user_id.toString() === user?.id.toString())
                      .map((task) => {
                        const assignedMember = members.find((m) => m.id.toString() === task.user_id.toString());
                        const assignedBy = teamLeaders.find((tl) => tl.id.toString() === task.assigned_by?.toString());
                        console.log('Rendu tâche utilisateur:', {
                          task_id: task.id,
                          user_id: task.user_id,
                          assigned_to: assignedMember ? `${assignedMember.prenom} ${assignedMember.nom}` : 'Non trouvé',
                          assigned_by: assignedBy ? `${assignedBy.prenom} ${assignedBy.nom}` : 'Non identifié',
                        });
                        return (
                          <tr
                            key={task.id}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                          >
                            <td className="p-3">{task.id || 'N/A'}</td>
                            <td className="p-3 text-center">
                              {assignedMember
                                ? getDisplayName(assignedMember.prenom, assignedMember.nom, task.user_id)
                                : getDisplayName(task.user_prenom, task.user_nom, task.user_id, 'Utilisateur non trouvé')}
                            </td>
                            <td className="p-3 text-center">{task.title}</td>
                            <td className="p-3 text-center truncate max-w-xs">{task.description || '-'}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  task.priority === 'low'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100'
                                    : task.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                                }`}
                              >
                                {task.priority === 'low' ? 'Faible' : task.priority === 'medium' ? 'Modéré' : 'Ultra'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-3 py-1.5 rounded-full text-xs ${
                                  task.status === 'todo'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100'
                                    : task.status === 'in-progress'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100'
                                }`}
                              >
                                {task.status === 'todo'
                                  ? 'À faire'
                                  : task.status === 'in-progress'
                                  ? 'En cours'
                                  : 'Terminé'}
                              </span>
                            </td>
                            <td className="p-3 text-center">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                            <td className="p-3 text-center">
                              {assignedBy
                                ? getDisplayName(assignedBy.prenom, assignedBy.nom, task.assigned_by)
                                : getDisplayName(task.assigned_by_prenom, task.assigned_by_nom, task.assigned_by, 'Non identifié')}
                            </td>
                            <td className="p-3 flex space-x-2 justify-center">
                              <button
                                onClick={() => handleViewTask(task)}
                                className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-1 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-200"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            {Object.values(tasksByUser).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Aucun membre ou aucune tâche assignée.</p>
            ) : (
              Object.values(tasksByUser).map((userTasks) => (
                <div key={userTasks.id} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-4">
                    Tâches de {userTasks.prenom} {userTasks.nom} (ID: {userTasks.id})
                  </h3>
                  {userTasks.tasks.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">Aucune tâche assignée pour ce membre.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm text-gray-700 dark:text-gray-300">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="p-3 rounded-tl-lg">ID</th>
                            <th className="p-3 text-center">Utilisateur</th>
                            <th className="p-3 text-center">Titre</th>
                            <th className="p-3 text-center">Description</th>
                            <th className="p-3 text-center">Priorité</th>
                            <th className="p-3 text-center min-w-[120px]">Statut</th>
                            <th className="p-3 text-center">Échéance</th>
                            <th className="p-3 text-center">Assignée par</th>
                            <th className="p-3 rounded-tr-lg text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userTasks.tasks.map((task) => {
                            const assignedMember = members.find((m) => m.id.toString() === task.user_id.toString());
                            const assignedBy = teamLeaders.find((tl) => tl.id.toString() === task.assigned_by?.toString());
                            console.log('Rendu tâche Team Leader:', {
                              task_id: task.id,
                              user_id: task.user_id,
                              assigned_to: assignedMember ? `${assignedMember.prenom} ${assignedMember.nom}` : 'Non trouvé',
                              assigned_by: assignedBy ? `${assignedBy.prenom} ${assignedBy.nom}` : 'Non identifié',
                            });
                            return (
                              <tr
                                key={task.id}
                                className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                              >
                                <td className="p-3">{task.id || 'N/A'}</td>
                                <td className="p-3 text-center">
                                  {assignedMember
                                    ? getDisplayName(assignedMember.prenom, assignedMember.nom, task.user_id)
                                    : getDisplayName(task.user_prenom, task.user_nom, task.user_id, 'Utilisateur non trouvé')}
                                </td>
                                <td className="p-3 text-center">{task.title}</td>
                                <td className="p-3 text-center truncate max-w-xs">{task.description || '-'}</td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      task.priority === 'low'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100'
                                        : task.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                                    }`}
                                  >
                                    {task.priority === 'low' ? 'Faible' : task.priority === 'medium' ? 'Modéré' : 'Ultra'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`px-3 py-1.5 rounded-full text-xs ${
                                      task.status === 'todo'
                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100'
                                        : task.status === 'in-progress'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100'
                                    }`}
                                  >
                                    {task.status === 'todo'
                                      ? 'À faire'
                                      : task.status === 'in-progress'
                                      ? 'En cours'
                                      : 'Terminé'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                                <td className="p-3 text-center">
                                  {assignedBy
                                    ? getDisplayName(assignedBy.prenom, assignedBy.nom, task.assigned_by)
                                    : getDisplayName(task.assigned_by_prenom, task.assigned_by_nom, task.assigned_by, 'Non identifié')}
                                </td>
                                <td className="p-3 flex space-x-2 justify-center">
                                  <button
                                    onClick={() => handleViewTask(task)}
                                    className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleEditTask(task)}
                                    className="p-1 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-200"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {viewTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center backdrop-blur-md transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-lg w-full transform scale-100 transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Détails de la tâche</h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                <strong>ID :</strong> {viewTask.id || 'N/A'}
              </p>
              <p>
                <strong>Utilisateur :</strong>{' '}
                {members.find((m) => m.id.toString() === viewTask.user_id?.toString())
                  ? getDisplayName(
                      members.find((m) => m.id.toString() === viewTask.user_id?.toString()).prenom,
                      members.find((m) => m.id.toString() === viewTask.user_id?.toString()).nom,
                      viewTask.user_id
                    )
                  : getDisplayName(viewTask.user_prenom, viewTask.user_nom, viewTask.user_id, 'Utilisateur non trouvé')}
              </p>
              <p>
                <strong>Titre :</strong> {viewTask.title}
              </p>
              <p>
                <strong>Description :</strong> {viewTask.description || '-'}
              </p>
              <p>
                <strong>Priorité :</strong>{' '}
                {viewTask.priority === 'low' ? 'Faible' : viewTask.priority === 'medium' ? 'Modéré' : 'Ultra'}
              </p>
              <p>
                <strong>Statut :</strong>{' '}
                {viewTask.status === 'todo' ? 'À faire' : viewTask.status === 'in-progress' ? 'En cours' : 'Terminé'}
              </p>
              <p>
                <strong>Date d'échéance :</strong> {viewTask.due_date ? new Date(viewTask.due_date).toLocaleDateString() : '-'}
              </p>
              <p>
                <strong>Assigné par :</strong>{' '}
                {teamLeaders.find((tl) => tl.id.toString() === viewTask.assigned_by?.toString())
                  ? getDisplayName(
                      teamLeaders.find((tl) => tl.id.toString() === viewTask.assigned_by?.toString()).prenom,
                      teamLeaders.find((tl) => tl.id.toString() === viewTask.assigned_by?.toString()).nom,
                      viewTask.assigned_by
                    )
                  : getDisplayName(viewTask.assigned_by_prenom, viewTask.assigned_by_nom, viewTask.assigned_by, 'Non identifié')}
              </p>
            </div>
            <button
              onClick={() => setViewTask(null)}
              className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {editTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center backdrop-blur-md transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-lg w-full transform scale-100 transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Modifier la tâche</h2>
            <form onSubmit={handleUpdateTask} className="grid grid-cols-1 gap-4">
              {user?.role === 'team_leader' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Membre</label>
                    <select
                      value={editTask.user_id}
                      onChange={(e) => setEditTask({ ...editTask, user_id: e.target.value })}
                      className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                      required
                    >
                      <option value="">Sélectionner un membre</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id.toString()}>
                          {member.prenom} {member.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignée par</label>
                    <select
                      value={editTask.assigned_by}
                      onChange={(e) => setEditTask({ ...editTask, assigned_by: e.target.value })}
                      className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                      required
                    >
                      <option value="">Sélectionner un assignateur</option>
                      {teamLeaders.map((leader) => (
                        <option key={leader.id} value={leader.id.toString()}>
                          {leader.prenom} {leader.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
                <input
                  type="text"
                  value={editTask.title}
                  onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={editTask.description}
                  onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priorité</label>
                <select
                  value={editTask.priority}
                  onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  required
                >
                  <option value="low">Faible</option>
                  <option value="medium">Modéré</option>
                  <option value="high">Ultra</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                <select
                  value={editTask.status}
                  onChange={(e) => setEditTask({ ...editTask, status: e.target.value })}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  required
                >
                  <option value="todo">À faire</option>
                  <option value="in-progress">En cours</option>
                  <option value="completed">Terminé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date d'échéance</label>
                <input
                  type="date"
                  value={editTask.due_date}
                  onChange={(e) => setEditTask({ ...editTask, due_date: e.target.value })}
                  className="mt-1 p-3 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditTask(null)}
                  className="px-5 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 transition-all duration-200 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeaderPage;