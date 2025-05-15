import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Plus, Menu, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  const completedTasks = [
    "Rapport final complété",
    "Tâche 'Refactorisation' terminée",
    "Correction du bug #124 complétée",
  ];

  // Ferme le panneau si clic en dehors
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300 relative">
      <div className="px-4 py-3 flex items-center justify-between">

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? 
            <X size={24} className="transition-all duration-200" /> : 
            <Menu size={24} className="transition-all duration-200" />
          }
        </button>

        {/* Search bar - desktop */}
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

        {/* Search icon - mobile */}
        <div className="md:hidden flex items-center">
          <button
            className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3 relative">
          <div className="relative" ref={notificationRef}>
            <button
              className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white relative"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 bg-accent-500 rounded-full"></span>
            </button>

            {/* Notification Panel */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b dark:border-gray-600 font-semibold text-gray-800 dark:text-white">
                  Tâches complétées
                </div>
                <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-600">
                  {completedTasks.map((task, idx) => (
                    <li key={idx} className="p-3 text-sm text-gray-700 dark:text-gray-200">
                      ✅ {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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
              placeholder="Search tasks..."
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg rounded-b-lg mb-4 mx-2">
          <div className="px-4 py-3 flex flex-col space-y-3">
            <Link to="/TaskForm" className="flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-300 shadow-sm">
              <Plus size={16} className="mr-1" /> Nouvelle tâche
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
