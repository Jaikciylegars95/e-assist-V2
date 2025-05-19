import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Plus, Menu, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dueTasks, setDueTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications depuis l'API backend
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/tasks/notifications');
      if (!response.ok) throw new Error('Erreur récupération tâches');
      const data = await response.json();
      setDueTasks(data.dueTasks);
      setCompletedTasks(data.completedTasks);
    } catch (error) {
      console.error(error);
      setDueTasks([]);
      setCompletedTasks([]);
    }
  };

  // Ouvrir/fermer notifications + fetch si ouverture
  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => {
      if (!prev) fetchNotifications();
      return !prev;
    });
  };

  // Ferme notification si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300 relative">
      <div className="px-4 py-3 flex items-center justify-between">

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Search bar desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
              placeholder="Rechercher une tâche..."
            />
          </div>
        </div>

        {/* Search icon mobile */}
        <div className="md:hidden flex items-center">
          <button
            className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Toggle search"
          >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>

        {/* Right side: notifications + theme toggle */}
        <div className="flex items-center space-x-3 relative" ref={notificationRef}>
          <button
            className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white relative"
            onClick={toggleNotifications}
            aria-haspopup="true"
            aria-expanded={isNotificationsOpen}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {(dueTasks.length > 0 || completedTasks.length > 0) && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-accent-500 rounded-full"></span>
            )}
          </button>

          {/* Notification panel */}
          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
              <div className="p-4 border-b dark:border-gray-600 font-semibold text-gray-800 dark:text-white">
                Tâches à échéance
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-600 max-h-40 overflow-y-auto">
                {dueTasks.length === 0 && (
                  <li className="p-3 italic text-gray-500 dark:text-gray-400">Aucune tâche à échéance</li>
                )}
                {dueTasks.map((task) => (
                  <li key={task.id} className="p-3 text-yellow-600 dark:text-yellow-400">
                    ⏰ {task.title}
                  </li>
                ))}
              </ul>

              <div className="p-4 border-t border-b dark:border-gray-600 font-semibold text-gray-800 dark:text-white">
                Tâches complétées
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-600 max-h-40 overflow-y-auto">
                {completedTasks.length === 0 && (
                  <li className="p-3 italic text-gray-500 dark:text-gray-400">Aucune tâche complétée</li>
                )}
                {completedTasks.map((task) => (
                  <li key={task.id} className="p-3 text-green-600 dark:text-green-400">
                    ✅ {task.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* Mobile search bar */}
      {isSearchOpen && (
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
              placeholder="Rechercher une tâche..."
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg rounded-b-lg mb-4 mx-2">
          <div className="px-4 py-3 flex flex-col space-y-3">
            <Link
              to="/TaskForm"
              className="flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-300 shadow-sm"
            >
              <Plus size={16} className="mr-1" /> Nouvelle tâche
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
