import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import LeftAnimation from './LeftAnimation';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stayConnected, setStayConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Vérifier le token et le rôle au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token trouvé au chargement:', token);
      const verifyRole = async () => {
        try {
          const res = await fetch(`${BASE_API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('LoginPage - Réponse verify:', res.status);
          const data = await res.json();
          console.log('LoginPage - Données verify:', data);
          if (!res.ok) throw new Error(data.error || 'Token invalide');
          if (data.role === 'team_leader') {
            console.log('Redirection vers /team-leader depuis useEffect');
            navigate('/team-leader');
          } else {
            console.log('Redirection vers /dashboard depuis useEffect');
            navigate('/dashboard');
          }
        } catch (err) {
          console.error('LoginPage - Erreur vérification token:', err.message);
          localStorage.removeItem('token');
        }
      };
      verifyRole();
    } else {
      console.log('Aucun token trouvé, rester sur /login');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    console.log('Tentative de connexion:', { email, stayConnected });

    try {
      const response = await fetch(`${BASE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, stayConnected }),
      });
      const data = await response.json();
      console.log('Réponse login:', data);
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }
      localStorage.setItem('token', data.token);
      if (data.role === 'team_leader') {
        console.log('Rôle team_leader détecté, redirection vers /team-leader');
        navigate('/team-leader');
      } else {
        console.log('Rôle non team_leader, redirection vers /dashboard');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Erreur connexion:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation pour les champs et le bouton
  const inputVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.2, duration: 0.5 },
    }),
  };

  const buttonVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.6, duration: 0.5, type: 'spring', stiffness: 120 },
    },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  const checkboxVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { delay: 0.8, duration: 0.5 },
    },
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Side - Animation */}
      <motion.div
        className="w-full md:w-3/4 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute top-8 left-8 text-white text-3xl font-extrabold tracking-tight">
          Taskflow
        </div>
        <LeftAnimation />
        <div className="hidden md:flex absolute bottom-8 right-8 text-white text-sm items-center font-medium">
          Découvrez une gestion simplifiée avec Taskflow <ChevronRight className="ml-2 h-5 w-5" />
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        className="w-full md:w-1/4 bg-white flex items-center justify-center p-4 md:p-8 shadow-2xl"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="w-full max-w-xs">
          <motion.h1
            className="text-3xl font-extrabold text-gray-900 mb-2 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Bienvenue sur Taskflow
          </motion.h1>
          <motion.p
            className="text-gray-600 mb-6 text-center text-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Connectez-vous pour gérer vos tâches efficacement
          </motion.p>
          {error && (
            <motion.div
              className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          <form onSubmit={handleLogin} className="flex flex-col space-y-4">
            <motion.input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              disabled={isLoading}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            />
            <motion.input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              disabled={isLoading}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              custom={2}
            />
            <motion.div
              className="flex items-center justify-between"
              variants={checkboxVariants}
              initial="hidden"
              animate="visible"
            >
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={stayConnected}
                  onChange={(e) => setStayConnected(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span>Reste connecté</span>
              </label>
              <Link to="/signup" className="text-blue-600 text-sm hover:underline">
                Créer un compte
              </Link>
            </motion.div>
            <motion.button
              type="submit"
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:bg-blue-400 transition-all text-sm font-medium"
              disabled={isLoading}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              ) : (
                'Se connecter'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;