import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  AlertCircle
} from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';

const Dashboard = () => {
  const { tasks, addTask, updateTask, deleteTask, loading } = useTasks();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(undefined);

  // Fonction pour vérifier si une date est valide
  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  // Fonction pour formater une date au format "YYYY-MM-DD" dans le fuseau local
  const formatDateLocal = (dateStr) => {
    if (!dateStr) return null;

    let d;
    if (typeof dateStr === 'string') {
      // Essayer le format ISO ou standard
      if (isValidDate(dateStr)) {
        d = new Date(dateStr);
      } else {
        // Essayer le format DD/MM/YYYY
        const parts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (parts) {
          d = new Date(`${parts[3]}-${parts[2]}-${parts[1]}`);
        } else {
          return null; // Format non reconnu
        }
      }
    } else {
      // Si dateStr est un objet Date
      d = dateStr;
    }

    if (isNaN(d.getTime())) return null;
    // Normaliser au début de la journée dans le fuseau local
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  // Calcul de la date d'aujourd'hui et des bornes de la semaine
  const now = new Date();
  const todayIso = formatDateLocal(now); // Devrait donner "2025-05-15"

  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Débogage détaillé

  // Toutes les tâches
  const totalTasks = tasks.length;

  // Tâches complétées
  const completedTasks = tasks.filter(task => task.status === 'completed').length;

  // Tâches en cours (non complétées)
  const inProgressTasks = tasks.filter(task => task.status !== 'completed').length;

  // Tâches avec échéance aujourd’hui (non complétées)
  const dueTodayTasks = tasks.filter(task => {
    if (!isValidDate(task.dueDate)) return false;
    const dueDateLocal = formatDateLocal(task.dueDate);
    return dueDateLocal === todayIso && task.status !== 'completed';
  }).length;

  // Tâches avec échéance dans la semaine (lundi à dimanche, non complétées)
  const dueThisWeekTasks = tasks.filter(task => {
    if (!isValidDate(task.dueDate)) return false;
    const dueDate = new Date(task.dueDate);
    const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    return dueDateNormalized >= monday && dueDateNormalized <= sunday && task.status !== 'completed';
  }).length;

  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  const handleAddTask = (taskData) => {
    addTask(taskData);
    setShowTaskForm(false);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleUpdateTask = (taskData) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      setEditingTask(undefined);
      setShowTaskForm(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 dark:text-gray-400">Chargement des tâches...</div>;
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
      
      {/* Stats Section */}
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
              <BarChart3 size={24} className="text-accent-600 dark:text-accent-400" />
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
              <AlertCircle size={24} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Échéance cette semaine</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dueThisWeekTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-task overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <Clock size={20} className="text-red-600 dark:text-red-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Échéance aujourd’hui</h2>
            </div>
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {dueTodayTasks}
            </span>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {dueTodayTasks > 0 ? (
              tasks
                .filter(task => {
                  if (!isValidDate(task.dueDate)) return false;
                  const dueDateLocal = formatDateLocal(task.dueDate);
                  return dueDateLocal === todayIso && task.status !== 'completed';
                })
                .map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={() => handleEditTask(task)} 
                    onDelete={() => deleteTask(task.id)} 
                  />
                ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                {tasks.some(task => task.dueDate) 
                  ? "Aucune tâche à échéance aujourd’hui."
                  : "Aucune tâche avec une date d'échéance définie."}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-task overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <Calendar size={20} className="text-yellow-600 dark:text-yellow-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Échéance cette semaine</h2>
            </div>
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {dueThisWeekTasks}
            </span>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {dueThisWeekTasks > 0 ? (
              tasks
                .filter(task => {
                  if (!isValidDate(task.dueDate)) return false;
                  const dueDate = new Date(task.dueDate);
                  const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                  return dueDateNormalized >= monday && dueDateNormalized <= sunday && task.status !== 'completed';
                })
                .map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={() => handleEditTask(task)} 
                    onDelete={() => deleteTask(task.id)} 
                  />
                ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                {tasks.some(task => task.dueDate) 
                  ? "Aucune tâche à échéance cette semaine."
                  : "Aucune tâche avec une date d'échéance définie."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section Tâches Récentes */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Tâches récentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tasks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6)
            .map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={() => handleEditTask(task)} 
                onDelete={() => deleteTask(task.id)} 
              />
            ))
          }
          {tasks.length === 0 && (
            <p className="text-center col-span-full text-gray-500 dark:text-gray-400">Aucune tâche récente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;