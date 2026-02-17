import React, { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { UserPreferences } from '../types';
import styles from './Preferences.module.css';

const Preferences: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    primaryHand: '',
    playStyle: '',
    backhandType: '',
    utrRating: null,
    utrProfileUrl: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await api.getPreferences();
      if (data) {
        setPreferences(data);
      }
    } catch (err: unknown) {
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await api.savePreferences(preferences);
      setMessage('Preferences saved successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserPreferences, value: string | number | null): void => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
      </div>
      <h2 className={styles.title}>Tennis Preferences</h2>
      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Primary Hand:</label>
          <select
            value={preferences.primaryHand}
            onChange={(e) => handleChange('primaryHand', e.target.value)}
            className={styles.select}
          >
            <option value="">Select...</option>
            <option value="right">Right</option>
            <option value="left">Left</option>
            <option value="ambidextrous">Ambidextrous</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Play Style:</label>
          <input
            type="text"
            value={preferences.playStyle}
            onChange={(e) => handleChange('playStyle', e.target.value)}
            placeholder="e.g., Aggressive baseliner, Serve and volley"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Backhand Type:</label>
          <select
            value={preferences.backhandType}
            onChange={(e) => handleChange('backhandType', e.target.value)}
            className={styles.select}
          >
            <option value="">Select...</option>
            <option value="one-handed">One-handed</option>
            <option value="two-handed">Two-handed</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>UTR Rating:</label>
          <input
            type="number"
            step="0.01"
            value={preferences.utrRating ?? ''}
            onChange={(e) => handleChange('utrRating', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="e.g., 8.5"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>UTR Profile URL:</label>
          <input
            type="url"
            value={preferences.utrProfileUrl}
            onChange={(e) => handleChange('utrProfileUrl', e.target.value)}
            placeholder="https://app.universaltennis.com/profiles/..."
            className={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={styles.submitButton}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>

    </div>
  );
};

export default Preferences;
