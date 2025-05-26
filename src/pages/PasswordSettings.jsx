import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const PasswordSettings = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Tous les champs sont requis', {
        position: 'top-center',
        autoClose: 2000,
      });
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas', {
        position: 'top-center',
        autoClose: 2000,
      });
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères', {
        position: 'top-center',
        autoClose: 2000,
      });
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expirée, veuillez vous reconnecter', {
        position: 'top-center',
        autoClose: 2000,
      });
      navigate('/login');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const isDark = document.documentElement.classList.contains('dark');
        await Swal.fire({
          title: 'Succès',
          text: 'Mot de passe mis à jour avec succès',
          icon: 'success',
          width: '90vw', // Ajusté pour responsivité
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#1f2937',
          confirmButtonText: 'OK',
          confirmButtonColor: '#2563eb',
          customClass: {
            popup: 'rounded-md shadow-md',
            confirmButton: 'px-3 py-1 text-xs sm:text-sm',
          },
        });
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors du changement de mot de passe', {
        position: 'top-center',
        autoClose: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          Changer le mot de passe
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              <Lock size={20} className="mr-2" /> Mot de passe actuel
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-4 sm:px-5 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
              placeholder="Mot de passe actuel"
              required
            />
          </div>
          <div>
            <label className="flex items-center text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              <Lock size={20} className="mr-2" /> Nouveau mot de passe
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-4 sm:px-5 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
              placeholder="Nouveau mot de passe"
              required
            />
          </div>
          <div>
            <label className="flex items-center text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              <Lock size={20} className="mr-2" /> Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 sm:px-5 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
              placeholder="Confirmer le mot de passe"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 sm:py-4 px-4 rounded-lg text-sm sm:text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-transform duration-200 hover:scale-105 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Changement...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordSettings;