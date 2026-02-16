import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Landing.module.css';

const Landing: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Tennis Tracker</p>
          <h1 className={styles.title}>Log matches, sharpen patterns, and stay match-ready.</h1>
          <p className={styles.subtitle}>
            Track scores, UTR, training notes, and preferences in one place.
            Built for players who want clarity between sessions.
          </p>
          <div className={styles.actions}>
            <Link to="/register" className={styles.primaryCta}>Get started</Link>
            <Link to="/login" className={styles.secondaryCta}>Sign in</Link>
          </div>
        </div>
        <div className={styles.heroCard}>
          <div className={styles.cardHeader}>
            <span>Recent form</span>
            <span className={styles.cardTag}>Last 30 days</span>
          </div>
          <div className={styles.cardStats}>
            <div>
              <p className={styles.statLabel}>Matches</p>
              <p className={styles.statValue}>12</p>
            </div>
            <div>
              <p className={styles.statLabel}>Win rate</p>
              <p className={styles.statValue}>67%</p>
            </div>
            <div>
              <p className={styles.statLabel}>UTR trend</p>
              <p className={styles.statValue}>+0.3</p>
            </div>
          </div>
          <div className={styles.cardFooter}>
            <div className={styles.trackRow}>
              <span>Serve consistency</span>
              <span className={styles.trackValue}>Up</span>
            </div>
            <div className={styles.trackRow}>
              <span>Backhand depth</span>
              <span className={styles.trackValue}>Needs work</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.featureGrid}>
        <div className={styles.featureCard}>
          <h3>Match journal</h3>
          <p>Capture set scores, surfaces, and notes after each session.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Preferences & style</h3>
          <p>Store hand, backhand type, and UTR profile for quick reference.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Progress snapshots</h3>
          <p>See your win rate and trends without spreadsheet work.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
