import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import CalendarPage from './pages/CalendarPage'; // your existing calendar page
import Questionnaire from './pages/Questionnaire';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';
import Dashboard from './pages/Dashboard'; // NEW overview page (you'll create this)

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <LandingPage />} />

      {/* Setup */}
      <Route path="/setup" element={<ProtectedRoute><Questionnaire /></ProtectedRoute>} />

      {/* Main Pages */}
      <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />

      {/* Settings */}
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;