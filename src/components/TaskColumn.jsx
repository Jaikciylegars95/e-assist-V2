import React from 'react';
import TaskCard from './TaskCard';

const TaskColumn = ({ 
  title, 
  tasks, 
  status, 
  icon, 
  onEditTask, 
  onDeleteTask 
}) => {
  const columnColors = {
    'todo': 'border-t-gray-400',
    'in-progress': 'border-t-accent-500',
    'completed': 'border-t-green-500'
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      <div className={`p-4 bg-white dark:bg-gray-800 border-t-4 ${columnColors[status]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
          </div>
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {tasks.length}
          </span>
        </div>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-250px)]">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEditTask} 
              onDelete={onDeleteTask} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
            <p>Aucune tâche</p>
            <p className="text-sm">Crée une tâche pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
