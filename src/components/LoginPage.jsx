import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import LeftAnimation from './LeftAnimation';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirection automatique si token présent
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      {/* Left Side - Animation */}
      <motion.div 
        className="w-full md:w-3/4 bg-blue-600 flex items-center justify-center relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute top-6 left-6 text-white text-2xl font-bold">
          e-assist
        </div>
        <LeftAnimation />
        <div className="hidden md:block absolute bottom-6 right-6 text-white text-sm items-center">
          Suivez-nous pour une nouvelle éxperience. <ChevronRight className="ml-2 h-4 w-4" />
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div 
        className="w-full md:w-1/4 bg-white flex items-center justify-center p-8"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <LoginForm 
          isLoading={isLoading} 
          setIsLoading={setIsLoading} 
          onLoginSuccess={handleLoginSuccess}
        />
      </motion.div>
    </div>
  );
};

export default LoginPage;
