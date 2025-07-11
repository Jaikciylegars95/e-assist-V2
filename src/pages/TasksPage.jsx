import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import TaskColumn from '../components/TaskColumn';
import TaskForm from '../components/TaskForm';
import { CheckSquare, Clock, CheckCircle, PlusCircle } from 'lucide-react';

const TasksPage = () => {
  const { addTask, updateTask, deleteTask, getTasksByStatus } = useTasks();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const todoTasks = getTasksByStatus('todo');
  const inProgressTasks = getTasksByStatus('in-progress');
  const completedTasks = getTasksByStatus('completed');

  // Navigation vers la page détail de la tâche
  const handleViewDetail = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleAddTask = async (taskData) => {
    setIsSubmitting(true);
    try {
      await addTask(taskData);
      setShowTaskForm(false);
    } catch (error) {
      alert('Erreur lors de la création de la tâche : ' + error.message);
    }
    setIsSubmitting(false);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleUpdateTask = async (taskData) => {
    if (editingTask) {
      setIsSubmitting(true);
      try {
        await updateTask(editingTask.id, taskData);
        setEditingTask(undefined);
        setShowTaskForm(false);
      } catch (error) {
        alert('Erreur lors de la mise à jour de la tâche : ' + error.message);
      }
      setIsSubmitting(false);
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
          initialData={editingTask}
          disabled={isSubmitting}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tâches</h1>
        <button
          onClick={() => setShowTaskForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-300 shadow-sm"
          disabled={isSubmitting}
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
          onViewDetail={handleViewDetail}
        />

        <TaskColumn
          title="En cours"
          tasks={inProgressTasks}
          status="in-progress"
          icon={<Clock size={18} className="text-accent-600 dark:text-accent-400" />}
          onEditTask={handleEditTask}
          onDeleteTask={deleteTask}
          onViewDetail={handleViewDetail}
        />

        <TaskColumn
          title="Completé"
          tasks={completedTasks}
          status="completed"
          icon={<CheckCircle size={18} className="text-green-600 dark:text-green-400" />}
          onEditTask={handleEditTask}
          onDeleteTask={deleteTask}
          onViewDetail={handleViewDetail}
        />
      </div>
    </div>
  );
};

export default TasksPage;
