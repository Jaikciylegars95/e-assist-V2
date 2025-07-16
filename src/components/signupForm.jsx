import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Calendar, Briefcase, Users } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    dateNaissance: '',
    poste: '',
    dateEmbauche: '',
    role: 'user',
    team_id: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState([]); // Liste des équipes disponibles
  const navigate = useNavigate();

  // Récupérer les équipes disponibles au chargement du composant
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/teams');
        setTeams(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des équipes:', err);
        setError('Impossible de charger les équipes. Veuillez réessayer ou contacter le support.');
      }
    };
    fetchTeams();
  }, []);

  const checkEmailAvailability = async (email) => {
    if (!email) {
      setEmailError('');
      setIsEmailChecked(false);
      return;
    }
    setIsCheckingEmail(true);
    setEmailError('');
    try {
      const response = await axios.post('http://localhost:3001/api/users/check-email', { email: email.toLowerCase() });
      if (!response.data.available) {
        setEmailError('Cet email est déjà utilisé. Veuillez en choisir un autre ou vérifier la casse (minuscules recommandées).');
        setIsEmailChecked(false);
      } else {
        setEmailError('');
        setIsEmailChecked(true);
      }
    } catch (err) {
      setEmailError('Erreur lors de la vérification de l\'email. Veuillez réessayer ou contacter le support.');
      setIsEmailChecked(false);
      console.error('Erreur checkEmailAvailability:', err.response?.data || err.message);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === 'email' ? value.toLowerCase() : value;
    setFormData({ ...formData, [name]: newValue });
    if (name === 'email') {
      setIsEmailChecked(false);
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (formData.email) {
      checkEmailAvailability(formData.email);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    // Validation des champs requis
    const requiredFields = ['nom', 'prenom', 'email', 'password', 'dateNaissance', 'poste', 'dateEmbauche', 'team_id'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Le champ ${field} est requis.`);
        setIsSubmitting(false);
        return;
      }
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer un email valide.');
      setIsSubmitting(false);
      return;
    }

    // Validation des dates
    if (isNaN(Date.parse(formData.dateNaissance))) {
      setError('Date de naissance invalide.');
      setIsSubmitting(false);
      return;
    }
    if (isNaN(Date.parse(formData.dateEmbauche))) {
      setError('Date d\'embauche invalide.');
      setIsSubmitting(false);
      return;
    }

    // Validation de team_id
    if (isNaN(parseInt(formData.team_id)) || parseInt(formData.team_id) <= 0) {
      setError('L\'ID de l\'équipe doit être un nombre positif.');
      setIsSubmitting(false);
      return;
    }

    // Vérification que team_id existe dans la liste des équipes
    const teamExists = teams.some((team) => team.id === parseInt(formData.team_id));
    if (!teamExists) {
      setError('L\'ID de l\'équipe est invalide ou n\'existe pas.');
      setIsSubmitting(false);
      return;
    }

    // Vérification de l'email
    if (!isEmailChecked || emailError) {
      setError(emailError || 'Veuillez vérifier que l\'email est disponible avant de soumettre.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Normalisation des données
      const normalizedFormData = {
        ...formData,
        team_id: parseInt(formData.team_id), // Conversion explicite en entier
        dateNaissance: new Date(formData.dateNaissance).toISOString().substring(0, 10), // Format ISO YYYY-MM-DD
        dateEmbauche: new Date(formData.dateEmbauche).toISOString().substring(0, 10), // Format ISO YYYY-MM-DD
      };

      console.log('Données envoyées au serveur:', normalizedFormData); // Log pour débogage

      const response = await axios.post('http://localhost:3001/api/users', normalizedFormData, {
        headers: { 'Content-Type': 'application/json' },
      });

      setMessage('Utilisateur ajouté avec succès !');
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        dateNaissance: '',
        poste: '',
        dateEmbauche: '',
        role: 'user',
        team_id: '',
      });
      setEmailError('');
      setIsEmailChecked(false);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Erreur détails:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage;
      if (err.response?.data?.message?.includes('ER_DUP_ENTRY') && err.response?.data?.message?.includes('users.PRIMARY')) {
        errorMessage = 'Erreur serveur : impossible de créer un nouvel utilisateur en raison d\'un problème d\'identifiant. Veuillez contacter l\'administrateur.';
      } else if (err.response?.data?.message === 'Email déjà utilisé') {
        errorMessage = 'Cet email est déjà utilisé. Veuillez en choisir un autre ou vérifier la casse (minuscules recommandées).';
      } else {
        errorMessage = err.response?.data?.message || "Une erreur s'est produite lors de l'inscription";
      }
      setError(errorMessage);
      if (err.response?.status === 409) {
        setFormData({ ...formData, email: '' });
        setIsEmailChecked(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <motion.h2
        className="text-3xl font-bold text-gray-900 text-center mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Inscription
      </motion.h2>

      {message && (
        <motion.div
          className="p-3 bg-green-100 text-green-700 rounded-md text-sm mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {message}
        </motion.div>
      )}
      {error && (
        <motion.div
          className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'nom', label: 'Nom', icon: <User className="h-5 w-5 text-gray-400" />, type: 'text' },
            { id: 'prenom', label: 'Prénom', icon: <User className="h-5 w-5 text-gray-400" />, type: 'text' },
            {
              id: 'email',
              label: 'Email',
              icon: <Mail className="h-5 w-5 text-gray-400" />,
              type: 'email',
              error: emailError,
            },
            { id: 'password', label: 'Mot de passe', icon: <Lock className="h-5 w-5 text-gray-400" />, type: 'password' },
            { id: 'dateNaissance', label: 'Date de naissance', icon: <Calendar className="h-5 w-5 text-gray-400" />, type: 'date' },
            { id: 'poste', label: 'Poste', icon: <Briefcase className="h-5 w-5 text-gray-400" />, type: 'text' },
            { id: 'dateEmbauche', label: 'Date d\'embauche', icon: <Calendar className="h-5 w-5 text-gray-400" />, type: 'date' },
          ].map(({ id, label, icon, type, error }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <div className="relative">
                {icon && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {icon}
                  </div>
                )}
                <input
                  id={id}
                  name={id}
                  type={type}
                  required
                  value={formData[id]}
                  onChange={handleChange}
                  onBlur={id === 'email' ? handleEmailBlur : undefined}
                  className={`block w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border ${
                    id === 'email' && emailError ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all`}
                  placeholder={type !== 'date' ? `Entrez votre ${label.toLowerCase()}` : ''}
                  disabled={isSubmitting || (id === 'email' && isCheckingEmail)}
                />
                {id === 'email' && isCheckingEmail && (
                  <p className="mt-1 text-sm text-gray-600">Vérification de l\'email en cours...</p>
                )}
                {id === 'email' && emailError && !isCheckingEmail && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>
            </div>
          ))}
          <div>
            <label htmlFor="team_id" className="block text-sm font-medium text-gray-700 mb-1">
              Équipe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="team_id"
                name="team_id"
                value={formData.team_id}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                required
                disabled={isSubmitting || teams.length === 0}
              >
                <option value="">Sélectionnez une équipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name || `Équipe ${team.id}`}
                  </option>
                ))}
              </select>
              {teams.length === 0 && (
                <p className="mt-1 text-sm text-red-600">Aucune équipe disponible. Veuillez contacter l'administrateur.</p>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              required
              disabled={isSubmitting}
            >
              <option value="user">Utilisateur</option>
              <option value="team_leader">Chef d'équipe</option>
            </select>
          </div>
        </div>

        <motion.button
          type="submit"
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isSubmitting || isCheckingEmail || !isEmailChecked || teams.length === 0
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
          whileHover={{ scale: isSubmitting || isCheckingEmail || !isEmailChecked || teams.length === 0 ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting || isCheckingEmail || !isEmailChecked || teams.length === 0 ? 1 : 0.98 }}
          disabled={isSubmitting || isCheckingEmail || !isEmailChecked || teams.length === 0}
        >
          {isSubmitting ? 'Envoi en cours...' : 'S\'inscrire'}
        </motion.button>
      </form>
    </div>
  );
};

export default SignupForm;