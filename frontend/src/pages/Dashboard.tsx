import React, { useState, useEffect } from 'react';
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

  const loadStats = async (): Promise<void> => {
    try {
      const [matches, utrData] = await Promise.all([
        api.getMatches(),
        api.getMyUtr().catch(() => null),
      ]);

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
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
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
