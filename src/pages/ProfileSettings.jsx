import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Mail, Camera } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const ProfileSettings = () => {
  const [userData, setUserData] = useState({
    email: '',
    profilePicture: 'https://via.placeholder.com/150', // URL corrigée
    dateNaissance: '',
    dateEmbauche: '',
  });
  const [previewPicture, setPreviewPicture] = useState(userData.profilePicture);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter', {
          position: 'top-center',
          autoClose: 2000,
        });
        navigate('/login');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;
        const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUserData({
            email: data.email || '',
            profilePicture: data.profilePicture || 'https://via.placeholder.com/150',
            dateNaissance: data.dateNaissance ? new Date(data.dateNaissance).toISOString().split('T')[0] : '',
            dateEmbauche: data.dateEmbauche ? new Date(data.dateEmbauche).toISOString().split('T')[0] : '',
          });
          setPreviewPicture(data.profilePicture || 'https://via.placeholder.com/150');
        } else {
          throw new Error(data.error || 'Erreur lors de la récupération des données');
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors de la récupération des données', {
          position: 'top-center',
          autoClose: 2000,
        });
      }
    };
    fetchUserData();
  }, [navigate]);

  const handlePictureChange = (e) => {
    const value = e.target.value;
    setUserData({ ...userData, profilePicture: value });
    setPreviewPicture(value || 'https://via.placeholder.com/150');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        throw new Error('Email invalide');
      }
      if (userData.profilePicture && !/^https?:\/\/.+$/.test(userData.profilePicture)) {
        throw new Error('URL de la photo invalide');
      }

      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userData.email,
          profilePicture: userData.profilePicture || null,
          dateNaissance: userData.dateNaissance || null,
          dateEmbauche: userData.dateEmbauche || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const isDark = document.documentElement.classList.contains('dark');
        await Swal.fire({
          title: 'Succès',
          text: 'Profil mis à jour avec succès',
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
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du profil', {
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
          Modifier le profil
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              <Mail size={20} className="mr-2" /> Email
            </label>
            <input
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              className="w-full px-4 sm:px-5 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
              placeholder="votre@email.com"
              required
            />
          </div>
          <div>
            <label className="flex items-center text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              <Camera size={20} className="mr-2" /> Photo de profil (URL)
            </label>
            <input
              type="url"
              value={userData.profilePicture}
              onChange={handlePictureChange}
              className="w-full px-4 sm:px-5 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
              placeholder="https://example.com/photo.jpg"
            />
            <div className="mt-4 flex justify-center">
              <img
                src={previewPicture}
                alt="Prévisualisation"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                onError={(e) => (e.target.src = '/fallback-image.jpg')} // Image de secours
              />
            </div>
          </div>
          <div>
            <label className="flex items-center text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              <Calendar size={20} className="mr-2" /> Date de naissance
            </label>
            <input
              type="date"
              value={userData.dateNaissance}
              onChange={(e) => setUserData({ ...userData, dateNaissance: e.target.value })}
              className="w-full px-4 sm:px-5 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
            />
          </div>
          <div>
            <label className="flex items-center text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              <Calendar size={20} className="mr-2" /> Date d'embauche
            </label>
            <input
              type="date"
              value={userData.dateEmbauche}
              onChange={(e) => setUserData({ ...userData, dateEmbauche: e.target.value })}
              className="w-full px-4 sm:px-5 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 sm:py-4 px-4 rounded-lg text-sm sm:text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-transform duration-200 hover:scale-105 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;