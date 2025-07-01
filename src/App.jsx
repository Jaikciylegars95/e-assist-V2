import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import TasksPage from './pages/TasksPage';
import TaskForm from './components/TaskForm';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './components/LoginPage';
import SignupForm from './components/signupForm';
import Calendrier from './components/calendar';
import TaskDetailPage from './pages/TaskDetailPage';
import ProfileSettings from './pages/ProfileSettings';
import PasswordSettings from './pages/PasswordSettings';
import AboutPage from './pages/AboutPage';
import Chat from './components/chat';
import TeamLeaderPage from './pages/TeamLeaderPage';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const verifyRole = async () => {
        try {
          const res = await fetch(`${BASE_API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('PrivateRoute - Réponse verify:', res.status);
          const data = await res.json();
          console.log('PrivateRoute - Données verify:', data);
          if (!res.ok) throw new Error(data.error || 'Token invalide');
          setRole(data.role);
        } catch (err) {
          console.error('PrivateRoute - Erreur vérification token:', err.message);
          localStorage.removeItem('token');
        } finally {
          setIsLoading(false);
        }
      };
      verifyRole();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  if (isLoading) return null;

  if (!token) return <Navigate to="/login" />;

  if (role === 'team_leader' && window.location.pathname === '/dashboard') {
    return <Navigate to="/team-leader" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50">
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                localStorage.getItem('token') ? (
                  <PrivateRoute>
                    <Navigate to="/dashboard" />
                  </PrivateRoute>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="calendar" element={<Calendrier />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="chat" element={<Chat />} />
              <Route path="task-form" element={<TaskForm />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="Profilesettings/:id" element={<ProfileSettings />} />
              <Route path="PasswordSettings/:id" element={<PasswordSettings />} />
              <Route path="aboutPage" element={<AboutPage />} />
              <Route path="tasks/:id" element={<TaskDetailPage />} />
              <Route path="team-leader" element={<TeamLeaderPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;