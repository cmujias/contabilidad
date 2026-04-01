import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';

// Simple Protected Route wrapper
const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const [authData, setAuthData] = useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    // Check initial auth state
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    const empresa_id = localStorage.getItem('empresa_id');
    const modulesStr = localStorage.getItem('modules');
    let modules = [];
    try {
      if (modulesStr) modules = JSON.parse(modulesStr);
    } catch(e) {}

    if (token && username && role) {
      setAuthData({
        isAuthenticated: true,
        user: { username, role, empresa_id, modules },
        loading: false
      });
    } else {
      setAuthData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  if (authData.loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando aplicación...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            authData.isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <LoginPage setAuthData={setAuthData} />
          } 
        />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute isAuthenticated={authData.isAuthenticated}>
              <Dashboard authData={authData} setAuthData={setAuthData} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
