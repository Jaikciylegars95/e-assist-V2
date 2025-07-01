import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  Users
} from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier le rôle de l'utilisateur
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const verifyRole = async () => {
        try {
          const res = await fetch(`${BASE_API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Sidebar - Réponse verify:', res.status);
          const data = await res.json();
          console.log('Sidebar - Données verify:', data);
          if (!res.ok) throw new Error(data.error || 'Token invalide');
          setRole(data.role);
        } catch (err) {
          console.error('Sidebar - Erreur vérification token:', err.message);
          localStorage.removeItem('token');
          navigate('/login');
        } finally {
          setIsLoading(false);
        }
      };
      verifyRole();
    } else {
      setIsLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  // Gérer les messages non lus
  useEffect(() => {
    const checkUnread = () => {
      const unread = localStorage.getItem('unreadMessages');
      let parsedUnread = {};
      try {
        parsedUnread = unread ? JSON.parse(unread) : {};
      } catch (e) {
        console.error('Erreur lors du parsing de unreadMessages:', e);
        parsedUnread = {};
      }
      const hasUnread = Object.values(parsedUnread).some(count => count > 0);
      setHasUnreadMessages(hasUnread);
    };

    checkUnread();
    window.addEventListener('storage', checkUnread);

    if (window.location.pathname === '/chat') {
      localStorage.setItem('unreadMessages', JSON.stringify({}));
      setHasUnreadMessages(false);
    }

    return () => {
      window.removeEventListener('storage', checkUnread);
    };
  }, []);

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

  const handleAboutClick = () => {
    navigate('/aboutPage');
  };

  if (isLoading) return null;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .blink {
            animation: blink 1s infinite;
          }
        `}
      </style>
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <CheckSquare size={24} className="text-primary-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">E-Assist</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        {role !== 'team_leader' && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <LayoutDashboard size={20} className="mr-3" />
            <span>Tableau de bord</span>
          </NavLink>
        )}

        {role === 'team_leader' && (
          <NavLink
            to="/team-leader"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <Users size={20} className="mr-3" />
            <span>Gestion d'équipe</span>
          </NavLink>
        )}

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
          }
        >
          <CheckSquare size={20} className="mr-3" />
          <span>Tâches</span>
        </NavLink>

        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
          }
        >
          <Calendar size={20} className="mr-3" />
          <span>Calendrier</span>
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
          }
        >
          <MessageSquare size={20} className="mr-3" />
          <span className="flex items-center">
            Messagerie
            {hasUnreadMessages && (
              <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full blink" aria-label="Nouveau message"></span>
            )}
          </span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
          }
        >
          <Settings size={20} className="mr-3" />
          <span>Paramètres</span>
        </NavLink>

        <div
          className="flex items-center px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
          onClick={handleAboutClick}
          role="button"
          aria-label="Accéder à la page À propos"
        >
          <HelpCircle size={20} className="mr-3" />
          <span>À propos</span>
        </div>

        <div
          onClick={handleLogout}
          className="flex items-center px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer mt-2"
          role="button"
          aria-label="Se déconnecter"
        >
          <LogOut size={20} className="mr-3" />
          <span>Déconnexion</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;