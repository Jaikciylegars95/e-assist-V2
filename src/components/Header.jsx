
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Plus, Menu, X, ChevronDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dueTasks, setDueTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [ignoredTaskIds, setIgnoredTaskIds] = useState(() => {
    // Charger les IDs ignorés depuis localStorage au démarrage
    const saved = localStorage.getItem('ignoredTaskIds');
    return saved ? JSON.parse(saved) : [];
  });
  const [userData, setUserData] = useState({
    fullName: 'Utilisateur',
    initials: 'U',
    position: '',
    hireDate: '',
    profilePicture: 'https://via.placeholder.com/40'
  });
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const priorityLabels = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute'
  };

  const statusLabels = {
    todo: 'À faire',
    'in-progress': 'En cours',
    completed: 'Terminé'
  };

  // Sauvegarder ignoredTaskIds dans localStorage à chaque mise à jour
  useEffect(() => {
    localStorage.setItem('ignoredTaskIds', JSON.stringify(ignoredTaskIds));
    console.log('ignoredTaskIds mis à jour:', ignoredTaskIds);
  }, [ignoredTaskIds]);

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

      const textResponse = await response.text();
      console.log('Réponse brute du serveur:', textResponse);

      const data = JSON.parse(textResponse);

      if (!response.ok) {
        console.error(`Erreur API: ${data.error}, Statut: ${response.status}`);
        if (response.status === 401 || data.error === 'Token non fourni' || data.error === 'Token invalide') {
          localStorage.removeItem('token');
          navigate('/login');
          toast.error('Session expirée, veuillez vous reconnecter', {
            position: 'top-center',
            autoClose: 2000
          });
          return;
        }
        toast.error('Erreur lors de la récupération des notifications', {
          position: 'top-center',
          autoClose: 2000
        });
        return;
      }

      console.log('Notifications récupérées:', data);
      // Filtrer les completedTasks pour exclure les tâches ignorées
      setDueTasks(data.dueTasks || []);
      setCompletedTasks(
        (data.completedTasks || []).filter(task => !ignoredTaskIds.includes(task.id))
      );
    } catch (error) {
      console.error('Erreur réseau ou parsing JSON:', error);
      toast.error('Erreur réseau lors de la récupération des notifications', {
        position: 'top-center',
        autoClose: 2000
      });
    }
  };

  const fetchTasks = async (query = '', priority = '', status = '') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Aucun token trouvé dans localStorage');
        navigate('/login');
        return;
      }

      const queryParams = new URLSearchParams();
      if (query) queryParams.append('q', query);
      if (priority) queryParams.append('priority', priority);
      if (status) queryParams.append('status', status);

      const url = `http://localhost:3001/api/tasks?${queryParams.toString()}`;
      console.log('Fetching tasks with URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Header API response:', data);

      if (!response.ok) {
        console.error(`Erreur API: ${data.error}, Statut: ${response.status}`);
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          toast.error('Session expirée, veuillez vous reconnecter', {
            position: 'top-center',
            autoClose: 2000
          });
        }
        setSearchResults([]);
        return;
      }

      const tasks = Array.isArray(data.tasks) ? data.tasks : Array.isArray(data) ? data : [];
      const filteredTasks = tasks.filter(task =>
        (!priority || task.priority === priority) &&
        (!status || task.status === status) &&
        (!query || task.title.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(filteredTasks);
    } catch (error) {
      console.error('Erreur lors de la recherche des tâches:', error);
      toast.error('Erreur réseau lors de la recherche des tâches', {
        position: 'top-center',
        autoClose: 2000
      });
      setSearchResults([]);
    }
  };

  const handleTaskClick = (taskId) => {
    console.log('Navigating to task:', taskId);
    setIsSearchResultsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setPriorityFilter('');
    setStatusFilter('');
    navigate(`/tasks/${taskId}`);
  };

  const handleNotificationClick = async (task, isCompleted) => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsNotificationsOpen(false);

    // Afficher les détails de la tâche
    await Swal.fire({
      title: task.title,
      html: `
        <div style="text-align: left;">
          <p><strong>Échéance :</strong> ${task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non définie'}</p>
          <p><strong>Statut :</strong> ${statusLabels[task.status] || task.status}</p>
        </div>
      `,
      icon: 'info',
      width: '400px',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#1f2937',
      confirmButtonText: 'OK',
      confirmButtonColor: '#2563eb',
      customClass: {
        popup: 'rounded-md shadow-md',
        confirmButton: 'px-3 py-1 text-sm rounded-md'
      }
    });

    if (isCompleted) {
      console.log(`Marquer la tâche comme ignorée, ID: ${task.id}`);
      // Ajouter l'ID de la tâche à ignoredTaskIds
      setIgnoredTaskIds(prev => {
        const newIgnored = [...prev, task.id];
        console.log('Nouveau ignoredTaskIds:', newIgnored);
        return newIgnored;
      });
      // Supprimer la tâche de completedTasks
      setCompletedTasks(prev => {
        const newTasks = prev.filter(t => t.id !== task.id);
        console.log('Nouveau completedTasks:', newTasks);
        return newTasks;
      });
    }

    navigate(`/tasks/${task.id}`);
  };

  const toggleNotifications = () => setIsNotificationsOpen(prev => !prev);
  const toggleUserMenu = () => setIsUserMenuOpen(prev => !prev);

  const handleLogout = () => {
    const isDark = document.documentElement.classList.contains('dark');

    Swal.fire({
      title: 'Déconnexion',
      text: "Voulez-vous vraiment vous déconnecter ?",
      icon: 'warning',
      width: '350px',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#1f2937',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Oui, se déconnecter',
      cancelButtonText: 'Non',
      padding: '1rem',
      customClass: {
        popup: 'rounded-md shadow-md',
        confirmButton: 'px-3 py-1 text-sm rounded-md',
        cancelButton: 'px-3 py-1 text-sm rounded-md'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate('/login');
        toast.success("Déconnexion réussie 👋", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: true,
          style: {
            fontSize: "13px",
            padding: "4px 10px",
            minHeight: "28px",
            lineHeight: "14px"
          }
        });
      }
    });
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Toutes les 60 secondes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchResultsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery || priorityFilter || statusFilter) {
        fetchTasks(searchQuery, priorityFilter, statusFilter);
        setIsSearchResultsOpen(true);
      } else {
        setSearchResults([]);
        setIsSearchResultsOpen(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, priorityFilter, statusFilter]);

  const getUserData = async (user_id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Aucun token trouvé dans localStorage');
        return {
          fullName: 'Utilisateur inconnu',
          initials: 'U',
          position: 'Non spécifié',
          hireDate: 'Non spécifié',
          profilePicture: 'https://via.placeholder.com/40'
        };
      }

      const response = await fetch(`http://localhost:3001/api/users/${user_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

        <div className="hidden md:flex items-center flex-1 max-w-md relative" ref={searchRef}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition duration-200"
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchResultsOpen(true)}
            />
          </div>
          {isSearchResultsOpen && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700 transition-all duration-200">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Priorité
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="">Toutes</option>
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Statut
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Tous</option>
                      <option value="todo">À faire</option>
                      <option value="in-progress">En cours</option>
                      <option value="completed">Terminé</option>
                    </select>
                  </div>
                </div>
              </div>
              <ul className="max-h-48 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                {searchResults.length === 0 ? (
                  <li className="p-5 italic text-gray-500 dark:text-gray-400 text-center">
                    Aucune tâche trouvée
                  </li>
                ) : (
                  searchResults.map(task => (
                    <li
                      key={task.id}
                      className="p-5 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200 cursor-pointer"
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{task.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Échéance: {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Priorité: {priorityLabels[task.priority] || task.priority} | Statut: {statusLabels[task.status] || task.status}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
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
              <span className="absolute top-0 right-0 h-5 w-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center">
                {dueTasks.length + completedTasks.length}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-3 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-800 dark:text-white">Tâches à échéance</div>
              <ul className="max-h-40 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                {dueTasks.length === 0 ? (
                  <li className="p-5 italic text-gray-500 dark:text-gray-400">Aucune tâche à échéance</li>
                ) : (
                  dueTasks
                    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                    .map(task => (
                      <li
                        key={task.id}
                        className="p-5 text-yellow-600 dark:text-yellow-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200"
                        onClick={() => handleNotificationClick(task, false)}
                      >
                        <div>⏰ {task.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Échéance: {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
                        </div>
                      </li>
                    ))
                )}
              </ul>
              <div className="p-5 border-t border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-800 dark:text-white">Tâches complétées</div>
              <ul className="max-h-40 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                {completedTasks.length === 0 ? (
                  <li className="p-5 italic text-gray-500 dark:text-gray-400">Aucune tâche complétée</li>
                ) : (
                  completedTasks.map(task => (
                    <li
                      key={task.id}
                      className="p-5 text-green-600 dark:text-green-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200"
                      onClick={() => handleNotificationClick(task, true)}
                    >
                      <div>✅ {task.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Échéance: {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
                      </div>
                    </li>
                  ))
                )}
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
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3">
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
                    className="block px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition"
                  >
                    Paramètres
                  </Link>
                  <div
                    className="px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition"
                    onClick={handleLogout}
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
        <div className="px-4 pb-3 md:hidden relative" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition duration-200"
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchResultsOpen(true)}
              autoFocus
            />
          </div>
          {isSearchResultsOpen && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700 transition-all duration-200">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Priorité
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="">Toutes</option>
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Statut
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Tous</option>
                      <option value="todo">À faire</option>
                      <option value="in-progress">En cours</option>
                      <option value="completed">Terminé</option>
                    </select>
                  </div>
                </div>
              </div>
              <ul className="max-h-48 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                {searchResults.length === 0 ? (
                  <li className="p-5 italic text-gray-500 dark:text-gray-400 text-center">
                    Aucune tâche trouvée
                  </li>
                ) : (
                  searchResults.map(task => (
                    <li
                      key={task.id}
                      className="p-5 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200 cursor-pointer"
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{task.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Échéance: {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Priorité: {priorityLabels[task.priority] || task.priority} | Statut: {statusLabels[task.status] || task.status}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg rounded-b-lg mb-4 mx-2">
          <div className="px-4 py-3 flex flex-col space-y-3">
            <Link
              to="/TaskForm"
              className="flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
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