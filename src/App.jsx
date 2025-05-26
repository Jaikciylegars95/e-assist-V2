import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import TasksPage from './pages/TasksPage';
import TaskForm from './components/TaskForm';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './components/LoginPage';
import SignupForm from './components/signupForm'; // Importation correcte
import Calendrier from './components/calendar';
import TaskDetailPage from "./pages/TaskDetailPage";
import ProfileSettings from "./pages/ProfileSettings";
import PasswordSettings from "./pages/PasswordSettings";
import AboutPage from "./pages/aboutPage";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
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
                localStorage.getItem('token')
                  ? <Navigate to="/dashboard" />
                  : <Navigate to="/login" />
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
              <Route path="task-form" element={<TaskForm />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="/Profilesettings/:id" element={<ProfileSettings />} />
              <Route path="/PasswordSettings/:id" element={<PasswordSettings />} />
              <Route path="/aboutPage" element={<AboutPage />} />
              <Route path="tasks/:id" element={<TaskDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
