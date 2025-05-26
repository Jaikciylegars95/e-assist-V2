import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle2,
  Clock,
  PlusCircle,
  BarChart2,
  Calendar,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

// Composant principal du tableau de bord
const Dashboard = () => {
  const { tasks, addTask, updateTask, deleteTask, loading, error } = useTasks();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Filtre les tâches valides et supprime les doublons par ID
  const validTasks = tasks
    .filter((t) => {
      const isValid = t && t.id && t.title;
      if (!isValid) {
        console.warn('Tâche invalide ignorée :', t);
        return false;
      }
      return true;
    })
    .filter((task, index, self) => 
      index === self.findIndex((t) => t.id === task.id)
    );

  // Journalise les tâches pour débogage
  useEffect(() => {
    console.log('Liste des tâches :', tasks);
    console.log('Tâches valides :', validTasks);
  }, [tasks]);

  // Vérifie si une date est valide
  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
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

  const today = new Date();
  const todayIso = normalizeDate(today.toISOString());
  console.log('Date d’aujourd’hui (ISO) :', todayIso);

  // Calcule la plage de la semaine courante (lundi à dimanche)
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  console.log('Plage de la semaine :', monday.toISOString(), sunday.toISOString());

  // Calcule les compteurs de tâches
  const totalTasks = validTasks.length;
  const completedTasks = validTasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = validTasks.filter((t) => t.status !== 'completed').length;
  const dueTodayTasks = validTasks.filter((t) => {
    const date = t.dueDate || t.due_date;
    if (!isValidDate(date)) {
      console.warn(`Date invalide pour la tâche ${t.title} : ${date}`);
      return false;
    }
    const dueDateLocal = normalizeDate(date);
    const isDueToday = dueDateLocal === todayIso && t.status !== 'completed';
    if (isDueToday) {
      console.log(`Tâche due aujourd’hui : ${t.title}, ID : ${t.id}, Date : ${date}, Date normalisée : ${dueDateLocal}`);
    }
    return isDueToday;
  }).length;
  const dueThisWeekTasks = validTasks.filter((t) => {
    const date = t.dueDate || t.due_date;
    if (!isValidDate(date)) {
      console.warn(`Date invalide pour la tâche ${t.title} : ${date}`);
      return false;
    }
    const dueDate = new Date(date);
    const dueDateAdjusted = new Date(dueDate.getTime() + 3 * 60 * 60 * 1000);
    const dueDateNormalized = new Date(dueDateAdjusted.getFullYear(), dueDateAdjusted.getMonth(), dueDateAdjusted.getDate());
    const isDueThisWeek = dueDateNormalized >= monday && dueDateNormalized <= sunday && t.status !== 'completed';
    if (isDueThisWeek) {
      console.log(`Tâche due cette semaine : ${t.title}, ID : ${t.id}, Date : ${date}, Date normalisée : ${dueDateNormalized.toISOString()}`);
    }
    return isDueThisWeek;
  }).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  console.log('Compteurs :', {
    totalTasks,
    completedTasks,
    inProgressTasks,
    dueTodayTasks,
    dueThisWeekTasks,
  });

  // Ajoute une nouvelle tâche
  const handleAddTask = async (taskData) => {
    console.log('Ajout de tâche avec :', taskData);
    try {
      const success = await addTask(taskData);
      if (success) {
        setShowTaskForm(false);
      }
      return success;
    } catch (err) {
      console.error('Erreur lors de l’ajout de la tâche :', err);
      toast.error('Échec de l’ajout de la tâche');
      return false;
    }
  };

  // Prépare l'édition d'une tâche
  const handleEditTask = (task) => {
    console.log('Tâche à modifier :', task);
    setEditingTask(task);
    setShowTaskForm(true);
  };

  // Met à jour une tâche
  const handleUpdateTask = async (taskData) => {
    if (editingTask) {
      console.log('Mise à jour de la tâche avec ID :', editingTask.id, 'Données :', taskData);
      try {
        const normalizedTaskData = {
          ...taskData,
          due_date: normalizeDate(taskData.dueDate || taskData.due_date),
        };
        delete normalizedTaskData.dueDate;
        const success = await updateTask(editingTask.id, normalizedTaskData);
        if (success) {
          setEditingTask(null);
          setShowTaskForm(false);
        }
        return success;
      } catch (err) {
        console.error('Erreur lors de la mise à jour de la tâche :', err);
        toast.error('Échec de la mise à jour de la tâche');
        return false;
      }
    }
    return false;
  };

  // Supprime une tâche
  const handleDeleteTask = async (id) => {
    console.log('Suppression de la tâche avec ID :', id);
    try {
      const success = await deleteTask(id);
      if (success) {
        toast.success('Tâche supprimée avec succès');
      }
      return success;
    } catch (err) {
      console.error('Erreur lors de la suppression de la tâche :', err);
      toast.error('Échec de la suppression de la tâche');
      return false;
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Chargement des tâches...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400">Erreur : {error}</div>;
  }

  return (
    <div className="animate-fadeIn">
      {(showTaskForm || editingTask) && (
        <TaskForm
          onSubmit={editingTask ? handleUpdateTask : handleAddTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          initialData={editingTask}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(new Date(), 'EEEE, MMMM d, yyyy', { locale: fr })}
          </p>
        </div>
        <button
          onClick={() => setShowTaskForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-300 shadow-sm"
        >
          <PlusCircle size={18} className="mr-2" /> Nouvelle tâche
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-task hover:shadow-task-hover transition-all duration-300">
          <div className="flex items-center">
            <div className="mr-4 p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <CheckSquare size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tâches totales</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-task hover:shadow-task-hover transition-all duration-300">
          <div className="flex items-center">
            <div className="mr-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle2 size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Complétées</h3>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks}</p>
                <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                  {completionRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-task hover:shadow-task-hover transition-all duration-300">
          <div className="flex items-center">
            <div className="mr-4 p-3 bg-accent-100 dark:bg-accent-900/30 rounded-full">
              <BarChart2 size={24} className="text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">En cours</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-task hover:shadow-task-hover transition-all duration-300">
          <div className="flex items-center">
            <div className="mr-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Clock size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Échéance aujourd’hui</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dueTodayTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-task hover:shadow-task-hover transition-all duration-300">
          <div className="flex items-center">
            <div className="mr-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <AlertTriangle size={24} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Échéance cette semaine</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dueThisWeekTasks}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-task overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <Clock size={20} className="text-red-600 dark:text-red-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Échéance aujourd’hui</h2>
            </div>
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {dueTodayTasks}
            </span>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {dueTodayTasks > 0 ? (
              validTasks
                .filter((t) => {
                  const date = t.dueDate || t.due_date;
                  if (!isValidDate(date)) return false;
                  const dueDateLocal = normalizeDate(date);
                  return dueDateLocal === todayIso && t.status !== 'completed';
                })
                .map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={() => handleEditTask(t)}
                    onDelete={() => handleDeleteTask(t.id)}
                  />
                ))
            ) : (
              <p className="text-center text-gray-700 dark:text-gray-400">
                {validTasks.some((t) => t.dueDate || t.due_date)
                  ? 'Aucune tâche à échéance aujourd’hui.'
                  : 'Aucune tâche avec une date d’échéance.'}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-task overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <Calendar size={20} className="text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Échéance cette semaine</h2>
            </div>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-400">
              {dueThisWeekTasks}
            </span>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {dueThisWeekTasks > 0 ? (
              validTasks
                .filter((t) => {
                  const date = t.dueDate || t.due_date;
                  if (!isValidDate(date)) return false;
                  const dueDate = new Date(date);
                  const dueDateAdjusted = new Date(dueDate.getTime() + 3 * 60 * 60 * 1000);
                  const dueDateNormalized = new Date(dueDateAdjusted.getFullYear(), dueDateAdjusted.getMonth(), dueDateAdjusted.getDate());
                  return dueDateNormalized >= monday && dueDateNormalized <= sunday && t.status !== 'completed';
                })
                .map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={() => handleEditTask(t)}
                    onDelete={() => handleDeleteTask(t.id)}
                  />
                ))
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-400">
                {validTasks.some((t) => t.dueDate || t.due_date)
                  ? 'Aucune tâche à échéance cette semaine.'
                  : 'Aucune tâche avec une date d’échéance.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tâches récentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {validTasks.length > 0 ? (
            (() => {
              const recentTasks = validTasks
                .map((t) => {
                  console.log(`Tâche récente analysée : ${t.title}, ID : ${t.id}, Date échéance : ${t.due_date || t.dueDate}, Statut : ${t.status}, Créée le : ${t.created_at}`);
                  return t;
                })
                .sort((a, b) => new Date(b.created_at || new Date()) - new Date(a.created_at || new Date()))
                .slice(0, 3);
              console.log('Tâches récentes après filtrage et tri :', recentTasks);
              return recentTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onEdit={() => handleEditTask(t)}
                  onDelete={() => handleDeleteTask(t.id)}
                />
              ));
            })()
          ) : (
            <p className="text-center col-span-full text-gray-600 dark:text-gray-400">Aucune tâche récente.</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Résumé des tâches</h2>
        <div className="max-w-md mx-auto" style={{ height: '250px' }}>
          <Bar
            data={{
              labels: ['Total', 'Complétées', 'En cours', 'Échéance aujourd’hui', 'Échéance cette semaine'],
              datasets: [
                {
                  label: 'Nombre de tâches',
                  data: [totalTasks, completedTasks, inProgressTasks, dueTodayTasks, dueThisWeekTasks],
                  backgroundColor: ['#4B5EAA', '#10B981', '#F59E0B', '#EF4444', '#FBBF24'],
                  borderColor: ['#3B4A8C', '#0A8F62', '#D97706', '#DC2626', '#D4A017'],
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Nombre de tâches',
                    font: { size: 12 },
                  },
                  ticks: { font: { size: 10 } },
                },
                x: {
                  title: {
                    display: true,
                    text: 'Catégories',
                    font: { size: 12 },
                  },
                  ticks: { font: { size: 10 } },
                },
              },
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;