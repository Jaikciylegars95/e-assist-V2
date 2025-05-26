import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle2,
  Clock,
  PlusCircle, // Replaced CirclePlus with PlusCircle
  BarChart2,
  Calendar,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { tasks, addTask, updateTask, deleteTask, loading, error } = useTasks();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(undefined);

  // Filtrer les tâches valides
  const validTasks = tasks.filter((t) => {
    const isValid = t && t.id && t.title;
    if (!isValid) {
      console.warn('Tâche invalide ignorée:', t);
    }
    return isValid;
  });

  // Débogage des tâches
  useEffect(() => {
    console.log('Tasks:', tasks);
    validTasks.forEach((t, index) => {
      if (!t?.id) {
        console.warn(`Tâche à l'index ${index} sans ID:`, t);
      }
    });
    const idCounts = validTasks.reduce((acc, t) => {
      acc[t.id] = (acc[t.id] || 0) + 1;
      return acc;
    }, {});
    Object.entries(idCounts).forEach(([id, count]) => {
      if (count > 1) {
        console.warn(`ID de tâche dupliqué détecté : ${id} apparaît ${count} fois`);
      }
    });
  }, [tasks]);

  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const formatDateLocal = (dateStr) => {
    if (!dateStr || !isValidDate(dateStr)) {
      console.warn(`Date invalide dans formatDateLocal : ${dateStr}`);
      return null;
    }
    try {
      const date = new Date(dateStr);
      const eatDate = new Date(date.getTime() + 3 * 60 * 60 * 1000); // EAT (UTC+3)
      return `${eatDate.getFullYear()}-${(eatDate.getMonth() + 1).toString().padStart(2, '0')}-${eatDate.getDate().toString().padStart(2, '0')}`;
    } catch (err) {
      console.error(`Erreur lors de la mise en forme de la date : ${dateStr}`, err);
      return null;
    }
  };

  const today = new Date();
  const todayIso = formatDateLocal(today.toISOString());
  console.log('todayIso:', todayIso);

  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const totalTasks = validTasks.length;
  const completedTasks = validTasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = validTasks.filter((t) => t.status !== 'completed').length;
  const dueTodayTasks = validTasks.filter((t) => {
    const date = t.dueDate;
    if (!isValidDate(date)) {
      console.warn(`Date invalide pour tâche ${t.title}: ${t.dueDate}`);
      return false;
    }
    const dueDateLocal = formatDateLocal(date);
    console.log(`Comparaison pour tâche ${t.id} (${t.title}): dueDateLocal=${dueDateLocal}, todayIso=${todayIso}`);
    return dueDateLocal === todayIso && t.status !== 'completed';
  }).length;
  const dueThisWeekTasks = validTasks.filter((t) => {
    const date = t.dueDate;
    if (!isValidDate(date)) return false;
    const dueDate = new Date(date);
    const dueDateAdjusted = new Date(dueDate.getTime() + 3 * 60 * 60 * 1000);
    const dueDateNormalized = new Date(dueDateAdjusted.getFullYear(), dueDateAdjusted.getMonth(), dueDateAdjusted.getDate());
    return dueDateNormalized >= monday && dueDateNormalized <= sunday && t.status !== 'completed';
  }).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleAddTask = async (taskData) => {
    console.log('handleAddTask appelé avec:', taskData);
    const success = await addTask(taskData);
    if (success) {
      setShowTaskForm(false);
    }
    return success;
  };

  const handleEditTask = (task) => {
    console.log('Tâche à modifier:', task);
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleUpdateTask = async (taskData) => {
    if (editingTask) {
      console.log('handleUpdateTask appelé avec:', taskData);
      const success = await updateTask(editingTask.id, taskData);
      if (success) {
        setEditingTask(undefined);
        setShowTaskForm(false);
      }
    }
  };

  const handleDeleteTask = async (id) => {
    console.log('handleDeleteTask appelé avec ID:', id);
    const success = await deleteTask(id);
    if (!success) {
      toast.error('Échec de la suppression de la tâche.');
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
            setEditingTask(undefined);
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
                  const date = t.dueDate;
                  if (!isValidDate(date)) {
                    console.warn(`Date invalide pour tâche ${t.title}: ${t.dueDate}`);
                    return false;
                  }
                  const dueDateLocal = formatDateLocal(date);
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
                {validTasks.some((t) => t.dueDate)
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
                  const date = t.dueDate;
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
                {validTasks.some((t) => t.dueDate)
                  ? 'Aucune tâche à échéance cette semaine.'
                  : 'Aucune tâche avec une date d’échéance.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tâches Récentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {validTasks.length > 0 ? (
            validTasks
              .sort((a, b) => new Date(b.createdAt || new Date()) - new Date(a.createdAt || new Date()))
              .slice(0, 3)
              .map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onEdit={() => handleEditTask(t)}
                  onDelete={() => handleDeleteTask(t.id)}
                />
              ))
          ) : (
            <p className="text-center col-span-full text-gray-600 dark:text-gray-400">Aucune tâche récente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;