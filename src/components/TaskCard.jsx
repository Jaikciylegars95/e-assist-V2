import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Flag, MoreHorizontal } from 'lucide-react';

const PriorityBadge = ({ priority }) => {
  const baseClasses = 'flex items-center text-sm font-medium px-2 py-1 rounded-full';

  switch (priority) {
    case 'high':
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>
          <Flag size={12} className="mr-1" />
          Élevée
        </span>
      );
    case 'medium':
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`}>
          <Flag size={12} className="mr-1" />
          Moyenne
        </span>
      );
    case 'low':
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>
          <Flag size={12} className="mr-1" />
          Faible
        </span>
      );
    default:
      return null;
  }
};

const TaskCard = ({ task, onEdit, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);

  const statusClasses = {
    todo: 'border-l-4 border-gray-400',
    'in-progress': 'border-l-4 border-accent-500',
    completed: 'border-l-4 border-green-500 bg-green-50/50 dark:bg-green-900/10',
  };

  const isValidDate = (dateStr) => {
    return dateStr && !isNaN(new Date(dateStr).getTime());
  };

  const formatDateDisplay = (dateStr) => {
    if (!isValidDate(dateStr)) {
      console.warn(`Date invalide pour l’affichage dans TaskCard: ${task.title} : ${dateStr}`);
      return null;
    }
    try {
      const date = new Date(dateStr);
      const eatDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
      return format(eatDate, 'd MMMM yyyy', { locale: fr });
    } catch (err) {
      console.error(`Erreur lors de la mise en forme de la date pour ${task.title} : ${dateStr}`, err);
      return null;
    }
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-task hover:shadow-task-hover p-4 mb-3 transition-all duration-300 ${statusClasses[task.status] || ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3
            className={`text-lg font-medium text-gray-900 dark:text-white mb-1 ${
              task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : ''
            }`}
          >
            {task.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{task.description || 'Aucune description'}</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full transition-colors duration-200"
          >
            <MoreHorizontal size={18} />
          </button>

          {showOptions && (
            <div className="absolute right-0 top-8 z-10 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
              <ul className="py-1">
                <li>
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowOptions(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Modifier
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onDelete(task.id);
                      setShowOptions(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Supprimer
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <PriorityBadge priority={task.priority} />

        {task.dueDate && isValidDate(task.dueDate) && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Clock size={14} className="mr-1" />
            <span>{formatDateDisplay(task.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;