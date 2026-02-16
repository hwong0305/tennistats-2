import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Preferences from './pages/Preferences';
import Journal from './pages/Journal';
import Matches from './pages/Matches';
import Landing from './pages/Landing';
import './App.css';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return null;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const HomeRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return null;
  }
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />;
};

function App(): React.ReactElement {
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const initialTheme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/preferences"
                element={
                  <PrivateRoute>
                    <Preferences />
                  </PrivateRoute>
                }
              />
              <Route
                path="/journal"
                element={
                  <PrivateRoute>
                    <Journal />
                  </PrivateRoute>
                }
              />
              <Route
                path="/matches"
                element={
                  <PrivateRoute>
                    <Matches />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<HomeRoute />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
