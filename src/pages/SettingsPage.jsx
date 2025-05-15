import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, User, Bell, Shield, Globe } from 'lucide-react';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Paramètre</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Apparence */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Apparence</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {theme === 'light' ? <Sun size={20} className="text-accent-500" /> : <Moon size={20} className="text-primary-500" />}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Thème</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Basculer entre le mode clair et le mode sombre.</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <span
                className={`${
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>

        {/* Compte */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Compte</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <User size={20} className="mt-0.5 text-gray-500 dark:text-gray-400" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-white">Informations personnelles</p>
                  <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                    Modifier
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mettez à jour votre nom, votre adresse e-mail et votre photo de profil.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Shield size={20} className="mt-0.5 text-gray-500 dark:text-gray-400" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-white">Mot de passe</p>
                  <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                    Enregistrer
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Modifiez votre mot de passe et vos paramètres de sécurité.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notifications</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell size={20} className="text-gray-500 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Notifications Email</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recevez des notifications par e-mail concernant les dates d'échéance des tâches et les changements de statut.
                </p>
              </div>
            </div>
            <button 
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <span
                className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              />
            </button>
          </div>
        </div>

        {/* À propos */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">À propos</h2>
          
          <div className="flex items-start space-x-3">
            <Globe size={20} className="mt-0.5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">E-assist</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Une application de gestion de tâches belle et intuitive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
