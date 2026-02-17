import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { CoachInvite } from '../types';
import styles from './CoachAccess.module.css';

const CoachAccess: React.FC = () => {
  const { user } = useAuth();
  const [coachEmail, setCoachEmail] = useState<string>('');
  const [invites, setInvites] = useState<CoachInvite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadInvites = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCoachInvites();
      setInvites(data.invites || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load invites';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'student') {
      loadInvites();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  const handleInvite = async (): Promise<void> => {
    if (!coachEmail.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.createCoachInvite(coachEmail.trim());
      setCoachEmail('');
      loadInvites();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invite';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'student') {
    return (
      <div className={styles.container}>
        <div className={styles.backButton}>
          <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
        </div>
        <div className={styles.header}>
          <h2 className={styles.title}>Coach Access</h2>
          <p className={styles.subtitle}>This page is only available to student accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
      </div>
      <div className={styles.header}>
        <h2 className={styles.title}>Coach Access</h2>
        <p className={styles.subtitle}>Invite a coach to review your profile, journals, and matches.</p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Invite a coach</h3>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="coachEmail">Coach email</label>
            <input
              id="coachEmail"
              type="email"
              value={coachEmail}
              onChange={(e) => setCoachEmail(e.target.value)}
              className={styles.input}
              placeholder="coach@example.com"
            />
          </div>
          <button type="button" onClick={handleInvite} className={styles.button} disabled={saving}>
            {saving ? 'Sending...' : 'Send invite'}
          </button>
        </div>
        {error && <p className={styles.emptyState}>{error}</p>}
      </div>

      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Your invites</h3>
        {loading ? (
          <p className={styles.emptyState}>Loading invites...</p>
        ) : invites.length === 0 ? (
          <p className={styles.emptyState}>No invites yet.</p>
        ) : (
          <div className={styles.inviteList}>
            {invites.map(invite => (
              <div key={invite.id} className={styles.inviteItem}>
                <strong>{invite.coach?.firstName || invite.coachEmail}</strong>
                <span className={styles.inviteMeta}>{invite.coach?.email || invite.coachEmail}</span>
                <span className={styles.statusBadge}>{invite.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachAccess;
