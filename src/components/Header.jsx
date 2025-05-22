import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Plus, Menu, X, ChevronDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dueTasks, setDueTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [userData, setUserData] = useState({
    fullName: 'Utilisateur',
    initials: 'U',
    position: '',
    hireDate: '',
    profilePicture: 'https://via.placeholder.com/40' // Kept for dropdown menu
  });
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Aucun token trouvé dans localStorage');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Erreur API: ${data.error}, Statut: ${response.status}`);
        if (response.status === 401 || data.error === 'Token non fourni' || data.error === 'Token invalide') {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        return;
      }

      setDueTasks(data.dueTasks || []);
      setCompletedTasks(data.completedTasks || []);
    } catch (error) {
      console.error('Erreur réseau ou parsing JSON:', error);
    }
  };

  const toggleNotifications = () => setIsNotificationsOpen(prev => !prev);
  const toggleUserMenu = () => setIsUserMenuOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isNotificationsOpen) fetchNotifications();
  }, [isNotificationsOpen]);

  const getUserData = async (user_id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${user_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        const fullName = `${data.nom} ${data.prenom}`;
        const initials = `${data.nom?.charAt(0)?.toUpperCase() || ''}${data.prenom?.charAt(0)?.toUpperCase() || ''}` || 'U';
        return {
          fullName,
          initials,
          position: data.poste || 'Non spécifié',
          hireDate: data.dateEmbauche ? new Date(data.dateEmbauche).toLocaleDateString('fr-FR') : 'Non spécifié',
          profilePicture: data.profilePicture || 'https://via.placeholder.com/40'
        };
      }
      return {
        fullName: 'Utilisateur inconnu',
        initials: 'U',
        position: 'Non spécifié',
        hireDate: 'Non spécifié',
        profilePicture: 'https://via.placeholder.com/40'
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return {
        fullName: 'Erreur utilisateur',
        initials: 'U',
        position: 'Non spécifié',
        hireDate: 'Non spécifié',
        profilePicture: 'https://via.placeholder.com/40'
      };
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user_id = payload.id;
        const user = await getUserData(user_id);
        setUserData(user);
      } catch (error) {
        setUserData({
          fullName: 'Utilisateur',
          initials: 'U',
          position: 'Non spécifié',
          hireDate: 'Non spécifié',
          profilePicture: 'https://via.placeholder.com/40'
        });
      }
    };
    fetchUserData();
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300 relative">
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          className="md:hidden text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Rechercher une tâche..."
            />
          </div>
        </div>

        <div className="md:hidden flex items-center">
          <button
            className="p-2 text-gray-500 dark:text-gray-300"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>

        <div className="flex items-center space-x-3 relative" ref={notificationRef}>
          <button
            className={`p-2 text-gray-500 dark:text-gray-300 relative ${(dueTasks.length || completedTasks.length) ? "animate-bounce" : ""}`}
            onClick={toggleNotifications}
          >
            <Bell size={20} />
            {(dueTasks.length || completedTasks.length) > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-accent-500 rounded-full"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50">
              <div className="p-4 border-b dark:border-gray-600 font-semibold text-gray-800 dark:text-white">Tâches à échéance</div>
              <ul className="max-h-40 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-600">
                {dueTasks.length === 0 ? (
                  <li className="p-3 italic text-gray-500 dark:text-gray-400">Aucune tâche à échéance</li>
                ) : dueTasks.map(task => (
                  <li key={task.id} className="p-3 text-yellow-600 dark:text-yellow-400">⏰ {task.title}</li>
                ))}
              </ul>
              <div className="p-4 border-t border-b dark:border-gray-600 font-semibold text-gray-800 dark:text-white">Tâches complétées</div>
              <ul className="max-h-40 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-600">
                {completedTasks.length === 0 ? (
                  <li className="p-3 italic text-gray-500 dark:text-gray-400">Aucune tâche complétée</li>
                ) : completedTasks.map(task => (
                  <li key={task.id} className="p-3 text-green-600 dark:text-green-400">✅ {task.title}</li>
                ))}
              </ul>
            </div>
          )}

          <ThemeToggle />

          <div className="relative" ref={userMenuRef}>
            <button
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-medium cursor-pointer"
              onClick={toggleUserMenu}
            >
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold">
                {userData.initials}
              </div>
              <span>{userData.fullName}</span>
              <ChevronDown size={16} className="text-gray-500 dark:text-gray-300" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b dark:border-gray-600 flex items-center space-x-3">
                  <img
                    src={userData.profilePicture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-white">{userData.fullName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{userData.position}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Embauché le: {userData.hireDate}
                    </div>
                  </div>
                </div>
                <div className="py-2 text-sm text-gray-800 dark:text-gray-200">
                  <Link
                    to="/settings"
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  >
                    Paramètres
                  </Link>
                  <div
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    onClick={() => {
                      localStorage.removeItem('token');
                      navigate('/login');
                    }}
                  >
                    Se déconnecter
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Rechercher une tâche..."
              autoFocus
            />
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg rounded-b-lg mb-4 mx-2">
          <div className="px-4 py-3 flex flex-col space-y-3">
            <Link
              to="/TaskForm"
              className="flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
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