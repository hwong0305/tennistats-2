import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { TennisMatch } from '../types';
import styles from './Dashboard.module.css';

interface DashboardStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  utrRating: number | null;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const getInitialTheme = (): 'light' | 'dark' => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [stats, setStats] = useState<DashboardStats>({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    utrRating: null,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleLabel = useMemo(
    () => (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'),
    [theme]
  );

  const loadStats = async (): Promise<void> => {
    try {
      const pageSize = 50;
      const firstPage = await api.getMatches({ page: 1, pageSize, sort: 'date-desc' });
      const totalPages = Math.ceil(firstPage.total / firstPage.pageSize);
      const remainingPages = totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              api.getMatches({ page: i + 2, pageSize, sort: 'date-desc' })
            )
          )
        : [];
      const matches = [
        ...firstPage.items,
        ...remainingPages.flatMap(page => page.items),
      ];

      const utrData = await api.getMyUtr().catch(() => null);

      const wins = matches.filter((m: TennisMatch) => m.result === 'win').length;
      const losses = matches.filter((m: TennisMatch) => m.result === 'loss').length;
      const total = matches.length;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

      setStats({
        totalMatches: total,
        wins,
        losses,
        winRate,
        utrRating: utrData?.utrRating || null,
      });
    } catch (err: unknown) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome, {user?.firstName || user?.email}!</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.themeToggle}
            aria-label={toggleLabel}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
          <button onClick={logout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardDefault}`}>
          <h3>Total Matches</h3>
          <p className={styles.statValue}>{stats.totalMatches}</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardWin}`}>
          <h3>Wins</h3>
          <p className={styles.statValue}>{stats.wins}</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardLoss}`}>
          <h3>Losses</h3>
          <p className={styles.statValue}>{stats.losses}</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardRate}`}>
          <h3>Win Rate</h3>
          <p className={styles.statValue}>{stats.winRate}%</p>
        </div>
      </div>

      {stats.utrRating && (
        <div className={styles.utrSection}>
          <h3>Your UTR Rating</h3>
          <p className={styles.utrValue}>{stats.utrRating}</p>
        </div>
      )}

      <div className={styles.navGrid}>
        <Link to="/preferences" className={`${styles.navCard} ${styles.navCardBlue}`}>
          <h3>Tennis Preferences</h3>
          <p>Update your playing style, hand preference, and backhand type</p>
        </Link>
        <Link to="/journal" className={`${styles.navCard} ${styles.navCardGreen}`}>
          <h3>Journal</h3>
          <p>Track your training notes and reflections</p>
        </Link>
        <Link to="/matches" className={`${styles.navCard} ${styles.navCardRed}`}>
          <h3>Matches</h3>
          <p>Record and review your match history</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
