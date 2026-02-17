import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { TennisMatch, UtrHistory } from '../types';
import { formatHumanDate } from '../utils/date';
import styles from './Dashboard.module.css';

interface DashboardStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  utrRating: number | null;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    utrRating: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [utrHistory, setUtrHistory] = useState<UtrHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [activePointId, setActivePointId] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
    loadHistory();
  }, []);

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

  const loadHistory = async (): Promise<void> => {
    setHistoryLoading(true);
    try {
      const data = await api.getUtrHistory();
      setUtrHistory(data.items || []);
    } catch (err: unknown) {
      console.error('Failed to load UTR history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sortedHistory = useMemo(() => {
    return [...utrHistory].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  }, [utrHistory]);

  const chartSeries = useMemo(() => {
    if (sortedHistory.length === 0) return null;
    const ratings = sortedHistory.map(item => item.rating);
    let min = Math.min(...ratings);
    let max = Math.max(...ratings);
    if (min === max) {
      min -= 0.5;
      max += 0.5;
    }
    const width = 600;
    const height = 180;
    const padding = 12;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const range = max - min || 1;

    const points = sortedHistory.map((item, idx) => {
      const x = sortedHistory.length === 1
        ? width / 2
        : padding + (idx / (sortedHistory.length - 1)) * innerWidth;
      const y = padding + (1 - (item.rating - min) / range) * innerHeight;
      return { x, y, item };
    });

    const linePath = points
      .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');
    const areaPath = `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

    return { points, linePath, areaPath, width, height, min, max };
  }, [sortedHistory]);

  const activePoint = useMemo(() => {
    if (!chartSeries || activePointId == null) return null;
    return chartSeries.points.find(point => point.item.id === activePointId) || null;
  }, [chartSeries, activePointId]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome, {user?.firstName || user?.email}!</h1>
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

      <section className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h3>UTR history</h3>
          {sortedHistory.length > 0 && (
            <span className={styles.historyMeta}>
              Latest {sortedHistory[sortedHistory.length - 1].rating} on {formatHumanDate(sortedHistory[sortedHistory.length - 1].recordedAt)}
            </span>
          )}
        </div>
        {historyLoading ? (
          <div className={styles.historyEmpty}>Loading UTR history...</div>
        ) : sortedHistory.length < 2 || !chartSeries ? (
          <div className={styles.historyEmpty}>
            Add at least two UTR updates to see your trend line.
          </div>
        ) : (
          <div className={styles.chartCard}>
            {activePoint && chartSeries && (
              <div
                className={styles.chartTooltip}
                style={{
                  left: `${(activePoint.x / chartSeries.width) * 100}%`,
                  top: `${(activePoint.y / chartSeries.height) * 100}%`,
                }}
              >
                <div className={styles.tooltipValue}>{activePoint.item.rating.toFixed(2)}</div>
                <div className={styles.tooltipDate}>{formatHumanDate(activePoint.item.recordedAt)}</div>
              </div>
            )}
            <svg
              className={styles.chart}
              viewBox={`0 0 ${chartSeries.width} ${chartSeries.height}`}
              role="img"
              aria-label="UTR rating history"
              preserveAspectRatio="none"
            >
              <path className={styles.chartArea} d={chartSeries.areaPath} />
              <path className={styles.chartLine} d={chartSeries.linePath} />
              {chartSeries.points.map(point => (
                <circle
                  key={point.item.id}
                  className={styles.chartDot}
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  onMouseEnter={() => setActivePointId(point.item.id)}
                  onMouseLeave={() => setActivePointId(null)}
                />
              ))}
            </svg>
            <div className={styles.chartFooter}>
              <span>{formatHumanDate(sortedHistory[0].recordedAt)}</span>
              <span className={styles.chartRange}>
                {chartSeries.min.toFixed(2)} - {chartSeries.max.toFixed(2)}
              </span>
              <span>{formatHumanDate(sortedHistory[sortedHistory.length - 1].recordedAt)}</span>
            </div>
          </div>
        )}
      </section>

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
