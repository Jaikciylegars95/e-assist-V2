import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const Sidebar = () => {
  const navigate = useNavigate();

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

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
      {/* Logo */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <CheckSquare size={24} className="text-primary-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">E-Assist</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        <NavLink
          to="/"
          end
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

        <div className="flex items-center px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer">
          <Calendar size={20} className="mr-3" />
          <span>Calendrier</span>
        </div>
      </nav>

      {/* Bottom Section */}
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

        <div className="flex items-center px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer">
          <HelpCircle size={20} className="mr-3" />
          <span>À propos</span>
        </div>

        <div
          onClick={handleLogout}
          className="flex items-center px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer mt-2"
        >
          <LogOut size={20} className="mr-3" />
          <span>Déconnexion</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
