import React, { useState } from 'react';
import { useTasks } from '../contexts/TaskContext'; // Assure-toi que cette fonction est correcte et retourne bien les tâches.
import TaskColumn from '../components/TaskColumn';
import TaskForm from '../components/TaskForm';
import { CheckSquare, Clock, CheckCircle, PlusCircle } from 'lucide-react';

const TasksPage = () => {
  const { tasks, addTask, updateTask, deleteTask, getTasksByStatus } = useTasks();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(undefined);

  // Filtrer les tâches en fonction de leur statut
  const todoTasks = getTasksByStatus('todo');
  const inProgressTasks = getTasksByStatus('in-progress');
  const completedTasks = getTasksByStatus('completed');

  // Fonction pour ajouter une tâche
  const handleAddTask = (taskData) => {
    addTask(taskData); // Assure-toi que la fonction addTask fonctionne bien côté context et backend
    setShowTaskForm(false);
  };

  // Fonction pour modifier une tâche
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  // Fonction pour mettre à jour une tâche
  const handleUpdateTask = (taskData) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData); // Assure-toi que updateTask fonctionne côté context et backend
      setEditingTask(undefined);
      setShowTaskForm(false);
    }
  };

  return (
    <div>
      {(showTaskForm || editingTask) && (
        <TaskForm 
          onSubmit={editingTask ? handleUpdateTask : handleAddTask} 
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(undefined);
          }}
          initialData={editingTask} // Initialise avec la tâche à éditer si elle existe
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tâches</h1>
        <button 
          onClick={() => setShowTaskForm(true)} 
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-300 shadow-sm"
        >
          <PlusCircle size={18} className="mr-2" /> Nouvelle tâche
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TaskColumn 
          title="To Do" 
          tasks={todoTasks} 
          status="todo" 
          icon={<CheckSquare size={18} className="text-gray-600 dark:text-gray-400" />}
          onEditTask={handleEditTask}
          onDeleteTask={deleteTask}
        />
        
        <TaskColumn 
          title="En cours" 
          tasks={inProgressTasks} 
          status="in-progress" 
          icon={<Clock size={18} className="text-accent-600 dark:text-accent-400" />}
          onEditTask={handleEditTask}
          onDeleteTask={deleteTask}
        />
        
        <TaskColumn 
          title="Completé" 
          tasks={completedTasks} 
          status="completed" 
          icon={<CheckCircle size={18} className="text-green-600 dark:text-green-400" />}
          onEditTask={handleEditTask}
          onDeleteTask={deleteTask}
        />
      </div>
    </div>
  );
};

export default TasksPage;
