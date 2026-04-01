import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Basic Placeholder Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Questionnaire from './pages/Questionnaire';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/setup" element={<ProtectedRoute><Questionnaire /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
