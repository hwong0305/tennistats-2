import React, { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { JournalEntry } from '../types';
import styles from './Journal.module.css';

interface JournalFormData {
  title: string;
  content: string;
  entryDate: string;
}

const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState<JournalFormData>({
    title: '',
    content: '',
    entryDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await api.getJournalEntries();
      setEntries(data);
    } catch (err: unknown) {
      console.error('Failed to load journal entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingEntry) {
        await api.updateJournalEntry(editingEntry.id, formData);
      } else {
        await api.createJournalEntry(formData);
      }
      setShowForm(false);
      setEditingEntry(null);
      resetForm();
      loadEntries();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save entry';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = (): void => {
    setFormData({
      title: '',
      content: '',
      entryDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleEdit = (entry: JournalEntry): void => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      entryDate: entry.entryDate,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await api.deleteJournalEntry(id);
      loadEntries();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry';
      alert(errorMessage);
    }
  };

  const toggleForm = (): void => {
    if (showForm) {
      setEditingEntry(null);
      resetForm();
    }
    setShowForm(!showForm);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
      </div>
      <div className={styles.header}>
        <h2>Journal Entries</h2>
        <button onClick={toggleForm}>
          {showForm ? 'Cancel' : 'Add Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label>Title:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Date:</label>
            <input
              type="date"
              value={formData.entryDate}
              onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Content:</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className={styles.textarea}
            />
          </div>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : (editingEntry ? 'Update' : 'Save')}
          </button>
        </form>
      )}

      <div className={styles.itemsList}>
        {entries.length === 0 ? (
          <p className={styles.emptyState}>No journal entries yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <h3>{entry.title}</h3>
                <span className={styles.itemMeta}>{entry.entryDate}</span>
              </div>
              <div className={styles.itemContent}>
                <p className={styles.preWrap}>{entry.content}</p>
              </div>
              <div className={styles.itemActions}>
                <button onClick={() => handleEdit(entry)}>Edit</button>
                <button onClick={() => handleDelete(entry.id)} className={styles.deleteButton}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Journal;
