import React, { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { JournalEntry } from '../types';
import { formatHumanDate, toDateInputValue } from '../utils/date';
import styles from './Journal.module.css';

interface JournalFormData {
  title: string;
  content: string;
  entryDate: string;
}

type JournalSort = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
const JOURNAL_PAGE_SIZE = 6;

const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(JOURNAL_PAGE_SIZE);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [sortBy, setSortBy] = useState<JournalSort>(() => {
    const stored = localStorage.getItem('journalSort');
    if (stored === 'date-desc' || stored === 'date-asc' || stored === 'title-asc' || stored === 'title-desc') {
      return stored;
    }
    return 'date-desc';
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [formData, setFormData] = useState<JournalFormData>({
    title: '',
    content: '',
    entryDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadEntries();
  }, [sortBy, currentPage]);

  useEffect(() => {
    localStorage.setItem('journalSort', sortBy);
    setCurrentPage(1);
  }, [sortBy]);

  const loadEntries = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await api.getJournalEntries({ page: currentPage, pageSize: JOURNAL_PAGE_SIZE, sort: sortBy });
      setEntries(data.items);
      setTotalEntries(data.total);
      setPageSize(data.pageSize);
      if (currentPage > 1 && data.items.length === 0) {
        setCurrentPage(Math.max(1, Math.ceil(data.total / data.pageSize)));
      }
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
      setCurrentPage(1);
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
      entryDate: toDateInputValue(entry.entryDate),
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

  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
      </div>
      <div className={styles.header}>
        <h2>Journal Entries</h2>
        <div className={styles.headerActions}>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as JournalSort)}
            aria-label="Sort journal entries"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>
          <button onClick={toggleForm}>
            {showForm ? 'Cancel' : 'Add Entry'}
          </button>
        </div>
      </div>

      <div className={styles.paginationRow}>
        <span className={styles.paginationMeta}>
          Page {safePage} of {totalPages}
        </span>
        <div className={styles.paginationControls}>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
          >
            Next
          </button>
        </div>
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
                <span className={styles.itemMeta}>{formatHumanDate(entry.entryDate)}</span>
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
