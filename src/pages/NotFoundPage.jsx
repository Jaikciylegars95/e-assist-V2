import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)]">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-5">
            <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Page non trouvée</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Nous n'avons pas pu trouver la page que vous recherchez. Elle a peut-être été déplacée ou supprimée.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-300 shadow-sm"
        >
          <Home size={18} className="mr-2" /> retourner à la page d'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
