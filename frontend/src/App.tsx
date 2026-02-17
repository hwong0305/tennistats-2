import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Preferences from './pages/Preferences';
import Journal from './pages/Journal';
import Matches from './pages/Matches';
import Landing from './pages/Landing';
import CoachAccess from './pages/CoachAccess';
import CoachDashboard from './pages/CoachDashboard';
import CoachStudent from './pages/CoachStudent';
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

const DashboardRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (user?.role === 'coach') {
    return <CoachDashboard />;
  }
  return <Dashboard />;
};

const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

interface ToolbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ theme, onToggleTheme }) => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const toggleLabel = useMemo(
    () => (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'),
    [theme]
  );

  return (
    <header className="app-toolbar">
      <div className="toolbar-inner">
        <Link to="/" className="toolbar-brand">Tennis Tracker</Link>
        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-icon-button"
            aria-label={toggleLabel}
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 11h3v2H1v-2zm10-10h2v3h-2V1zm9.66 3.46-1.41-1.41-1.8 1.79 1.42 1.42 1.79-1.8zM17 11h3v2h-3v-2zM11 20h2v3h-2v-3zM6.76 19.16l-1.42 1.42-1.79-1.8 1.41-1.41 1.8 1.79zM19.24 19.16l1.8 1.79 1.41-1.41-1.79-1.8-1.42 1.42zM12 6a6 6 0 100 12 6 6 0 000-12z"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21 14.5A8.5 8.5 0 019.5 3a7 7 0 1011.5 11.5z"
                />
              </svg>
            )}
          </button>
          {!isLoading && (isAuthenticated ? (
            <button type="button" onClick={logout} className="toolbar-button">
              Sign out
            </button>
          ) : (
            <Link to="/login" className="toolbar-link">Sign in</Link>
          ))}
        </div>
      </div>
    </header>
  );
};

function App(): React.ReactElement {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Toolbar
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardRoute />
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
              <Route
                path="/coach-access"
                element={
                  <PrivateRoute>
                    <CoachAccess />
                  </PrivateRoute>
                }
              />
              <Route
                path="/coach/students/:studentId"
                element={
                  <PrivateRoute>
                    <CoachStudent />
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
