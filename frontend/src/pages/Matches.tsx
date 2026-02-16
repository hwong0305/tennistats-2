import React, { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { TennisMatch } from '../types';
import { formatHumanDate, toDateInputValue } from '../utils/date';
import styles from './Matches.module.css';

type MatchFormat = 'bo3' | 'bo5';
type MatchSort = 'date-desc' | 'date-asc' | 'opponent-asc' | 'opponent-desc';
const MATCHES_PAGE_SIZE = 8;

interface SetScoreInput {
  userGames: string;
  oppGames: string;
  userTb: string;
  oppTb: string;
}

interface MatchFormData {
  opponentName: string;
  opponentUtr: string;
  matchDate: string;
  location: string;
  surface: string;
  result: string;
  notes: string;
  format: MatchFormat;
  sets: SetScoreInput[];
}

interface ParsedSetScore {
  userGames: number;
  oppGames: number;
  tbLoserPoints?: number;
}

const emptySet = (): SetScoreInput => ({ userGames: '', oppGames: '', userTb: '', oppTb: '' });

const parseIntOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
};

const parseMatchScoreString = (score: string | null | undefined): ParsedSetScore[] => {
  if (!score) return [];
  const parts = score
    .split(/\s*,\s*|\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  const sets: ParsedSetScore[] = [];
  for (const part of parts) {
    const m = part.match(/^(\d+)-(\d+)(?:\((\d+)\))?$/);
    if (!m) continue;
    const userGames = Number.parseInt(m[1], 10);
    const oppGames = Number.parseInt(m[2], 10);
    const tbLoserPoints = m[3] ? Number.parseInt(m[3], 10) : undefined;
    sets.push({ userGames, oppGames, tbLoserPoints });
  }
  return sets;
};

const validateSet = (
  setIndex: number,
  userGames: number,
  oppGames: number,
  userTb: number | null,
  oppTb: number | null
): string | null => {
  const label = `Set ${setIndex + 1}`;

  const inRange = (g: number): boolean => Number.isInteger(g) && g >= 0 && g <= 7;
  if (!inRange(userGames) || !inRange(oppGames)) {
    return `${label}: games must be an integer between 0 and 7.`;
  }

  if (userGames === oppGames) {
    return `${label}: set score cannot be tied.`;
  }

  const max = Math.max(userGames, oppGames);
  const min = Math.min(userGames, oppGames);
  const diff = max - min;

  // Standard tiebreak sets: 6-0..6-4, 7-5, 7-6
  const isValidNonTb = (max === 6 && diff >= 2) || (max === 7 && (min === 5 || min === 6));
  if (!isValidNonTb) {
    return `${label}: invalid set score ${userGames}-${oppGames}.`;
  }

  const isTiebreakSet = max === 7 && min === 6;
  if (isTiebreakSet) {
    if (userTb == null || oppTb == null) {
      return `${label}: tiebreak points are required for a 7-6 set.`;
    }
    if (!Number.isInteger(userTb) || !Number.isInteger(oppTb) || userTb < 0 || oppTb < 0) {
      return `${label}: tiebreak points must be non-negative integers.`;
    }

    const userWonSet = userGames > oppGames;
    const winnerTb = userWonSet ? userTb : oppTb;
    const loserTb = userWonSet ? oppTb : userTb;
    if (winnerTb < 7) {
      return `${label}: tiebreak winner must have at least 7 points.`;
    }
    if (winnerTb - loserTb < 2) {
      return `${label}: tiebreak must be won by 2 points.`;
    }
  } else {
    // No tiebreak fields needed for non-tiebreak set scores
    if (userTb != null || oppTb != null) {
      // Allow users to type then clear; don't hard fail.
    }
  }

  return null;
};

const renderSetRows = (sets: ParsedSetScore[]): React.ReactNode => {
  return sets.map((set, idx) => {
    let tbDisplay = '-';
    if (typeof set.tbLoserPoints === 'number') {
      const winner = Math.max(7, set.tbLoserPoints + 2);
      tbDisplay = `${winner}-${set.tbLoserPoints}`;
    }

    return (
      <tr key={idx}>
        <td>Set {idx + 1}</td>
        <td>{set.userGames}</td>
        <td>{set.oppGames}</td>
        <td>{tbDisplay}</td>
      </tr>
    );
  });
};

const Matches: React.FC = () => {
  const [matches, setMatches] = useState<TennisMatch[]>([]);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(MATCHES_PAGE_SIZE);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingMatch, setEditingMatch] = useState<TennisMatch | null>(null);
  const [sortBy, setSortBy] = useState<MatchSort>(() => {
    const stored = localStorage.getItem('matchesSort');
    if (stored === 'date-desc' || stored === 'date-asc' || stored === 'opponent-asc' || stored === 'opponent-desc') {
      return stored;
    }
    return 'date-desc';
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scoreError, setScoreError] = useState<string>('');
  const [formData, setFormData] = useState<MatchFormData>({
    opponentName: '',
    opponentUtr: '',
    matchDate: new Date().toISOString().split('T')[0],
    location: '',
    surface: '',
    result: '',
    notes: '',
    format: 'bo3',
    sets: [emptySet(), emptySet(), emptySet(), emptySet(), emptySet()],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadMatches();
  }, [sortBy, currentPage]);

  useEffect(() => {
    localStorage.setItem('matchesSort', sortBy);
    setCurrentPage(1);
  }, [sortBy]);

  const loadMatches = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await api.getMatches({ page: currentPage, pageSize: MATCHES_PAGE_SIZE, sort: sortBy });
      setMatches(data.items);
      setTotalMatches(data.total);
      setPageSize(data.pageSize);
      if (currentPage > 1 && data.items.length === 0) {
        setCurrentPage(Math.max(1, Math.ceil(data.total / data.pageSize)));
      }
    } catch (err: unknown) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setScoreError('');

    try {
      const maxSets = formData.format === 'bo5' ? 5 : 3;
      const setsToWin = formData.format === 'bo5' ? 3 : 2;

      // Validate sets and build matchScore
      const parsedSets: { userGames: number; oppGames: number; userTb: number | null; oppTb: number | null }[] = [];
      let foundEmpty = false;
      for (let i = 0; i < maxSets; i++) {
        const s = formData.sets[i];
        const ug = parseIntOrNull(s.userGames);
        const og = parseIntOrNull(s.oppGames);

        const isEmpty = ug == null && og == null;
        if (isEmpty) {
          foundEmpty = true;
          continue;
        }
        if (foundEmpty) {
          setScoreError(`Set ${i + 1}: please fill sets in order without gaps.`);
          setSaving(false);
          return;
        }
        if (ug == null || og == null) {
          setScoreError(`Set ${i + 1}: both players' game scores are required.`);
          setSaving(false);
          return;
        }

        const utb = parseIntOrNull(s.userTb);
        const otb = parseIntOrNull(s.oppTb);
        const err = validateSet(i, ug, og, utb, otb);
        if (err) {
          setScoreError(err);
          setSaving(false);
          return;
        }
        parsedSets.push({ userGames: ug, oppGames: og, userTb: utb, oppTb: otb });
      }

      if (parsedSets.length === 0) {
        setScoreError('Please enter at least one set score.');
        setSaving(false);
        return;
      }

      // Compute sets won and final result
      let userSetsWon = 0;
      let oppSetsWon = 0;
      for (const s of parsedSets) {
        if (s.userGames > s.oppGames) userSetsWon += 1;
        else oppSetsWon += 1;
      }

      if (userSetsWon !== setsToWin && oppSetsWon !== setsToWin) {
        setScoreError(`Match must end when someone wins ${setsToWin} sets for ${formData.format === 'bo5' ? 'best of 5' : 'best of 3'}.`);
        setSaving(false);
        return;
      }

      if (parsedSets.length > 0) {
        const winnerReachedAt = parsedSets.findIndex((_s, idx) => {
          const u = parsedSets.slice(0, idx + 1).filter(x => x.userGames > x.oppGames).length;
          const o = parsedSets.slice(0, idx + 1).filter(x => x.oppGames > x.userGames).length;
          return u === setsToWin || o === setsToWin;
        });
        if (winnerReachedAt !== -1 && parsedSets.length > winnerReachedAt + 1) {
          setScoreError('Extra sets entered after the match is already decided.');
          setSaving(false);
          return;
        }
      }

      const derivedResult: TennisMatch['result'] = userSetsWon > oppSetsWon ? 'win' : 'loss';
      if (formData.result && formData.result !== derivedResult) {
        setScoreError(`Result does not match the score. Based on sets, this should be a ${derivedResult}.`);
        setSaving(false);
        return;
      }

      const matchScore = parsedSets
        .map(s => {
          const isTb = Math.max(s.userGames, s.oppGames) === 7 && Math.min(s.userGames, s.oppGames) === 6;
          if (!isTb) return `${s.userGames}-${s.oppGames}`;
          const userWonSet = s.userGames > s.oppGames;
          const loserTb = userWonSet ? s.oppTb : s.userTb;
          return `${s.userGames}-${s.oppGames}(${loserTb ?? 0})`;
        })
        .join(', ');

      const matchData = {
        opponentName: formData.opponentName,
        opponentUtr: formData.opponentUtr ? parseFloat(formData.opponentUtr) : null,
        matchDate: formData.matchDate,
        location: formData.location,
        surface: formData.surface as TennisMatch['surface'],
        userSetsWon,
        opponentSetsWon: oppSetsWon,
        matchScore,
        result: (formData.result ? formData.result : derivedResult) as TennisMatch['result'],
        notes: formData.notes,
      };

      if (editingMatch) {
        await api.updateMatch(editingMatch.id, matchData);
      } else {
        await api.createMatch(matchData);
      }
      setShowForm(false);
      setEditingMatch(null);
      resetForm();
      setCurrentPage(1);
      loadMatches();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save match';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = (): void => {
    setFormData({
      opponentName: '',
      opponentUtr: '',
      matchDate: new Date().toISOString().split('T')[0],
      location: '',
      surface: '',
      result: '',
      notes: '',
      format: 'bo3',
      sets: [emptySet(), emptySet(), emptySet(), emptySet(), emptySet()],
    });
    setScoreError('');
  };

  const handleEdit = (match: TennisMatch): void => {
    const parsed = parseMatchScoreString(match.matchScore);
    const inferredFormat: MatchFormat = parsed.length >= 4 ? 'bo5' : 'bo3';

    const sets: SetScoreInput[] = [emptySet(), emptySet(), emptySet(), emptySet(), emptySet()];
    parsed.slice(0, 5).forEach((s, idx) => {
      sets[idx].userGames = String(s.userGames);
      sets[idx].oppGames = String(s.oppGames);
      if (typeof s.tbLoserPoints === 'number') {
        // We only know the loser points from the stored score. Infer a minimal winner TB score.
        const userWonSet = s.userGames > s.oppGames;
        const loser = s.tbLoserPoints;
        const winner = Math.max(7, loser + 2);
        if (userWonSet) {
          sets[idx].userTb = String(winner);
          sets[idx].oppTb = String(loser);
        } else {
          sets[idx].userTb = String(loser);
          sets[idx].oppTb = String(winner);
        }
      }
    });

    setEditingMatch(match);
    setFormData({
      opponentName: match.opponentName,
      opponentUtr: match.opponentUtr?.toString() || '',
      matchDate: toDateInputValue(match.matchDate),
      location: match.location || '',
      surface: match.surface || '',
      result: match.result || '',
      notes: match.notes || '',
      format: inferredFormat,
      sets,
    });
    setScoreError('');
    setShowForm(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      await api.deleteMatch(id);
      loadMatches();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete match';
      alert(errorMessage);
    }
  };

  const toggleForm = (): void => {
    if (showForm) {
      setEditingMatch(null);
      resetForm();
    }
    setShowForm(!showForm);
  };

  const maxSets = formData.format === 'bo5' ? 5 : 3;

  const updateSet = (idx: number, patch: Partial<SetScoreInput>): void => {
    setFormData(prev => {
      const sets = prev.sets.slice();
      sets[idx] = { ...sets[idx], ...patch };
      return { ...prev, sets };
    });
  };

  const shouldShowTiebreak = (idx: number): boolean => {
    const ug = parseIntOrNull(formData.sets[idx].userGames);
    const og = parseIntOrNull(formData.sets[idx].oppGames);
    if (ug == null || og == null) return false;
    const max = Math.max(ug, og);
    const min = Math.min(ug, og);
    return (max === 7 && min === 6) || (ug === 6 && og === 6);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  const totalPages = Math.max(1, Math.ceil(totalMatches / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
      </div>
      <div className={styles.header}>
        <h2>Match History</h2>
        <div className={styles.headerActions}>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MatchSort)}
            aria-label="Sort matches"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="opponent-asc">Opponent A-Z</option>
            <option value="opponent-desc">Opponent Z-A</option>
          </select>
          <button onClick={toggleForm}>
            {showForm ? 'Cancel' : 'Add Match'}
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
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Opponent Name:</label>
              <input
                type="text"
                value={formData.opponentName}
                onChange={(e) => setFormData({ ...formData, opponentName: e.target.value })}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Opponent UTR:</label>
              <input
                type="number"
                step="0.01"
                value={formData.opponentUtr}
                onChange={(e) => setFormData({ ...formData, opponentUtr: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Date:</label>
              <input
                type="date"
                value={formData.matchDate}
                onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Location:</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Surface:</label>
              <select
                value={formData.surface}
                onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                className={styles.select}
              >
                <option value="">Select...</option>
                <option value="hard">Hard</option>
                <option value="clay">Clay</option>
                <option value="grass">Grass</option>
                <option value="carpet">Carpet</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Result:</label>
              <select
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className={styles.select}
              >
                <option value="">Select...</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
              </select>
            </div>
          </div>

          <div className={styles.scoreSection}>
            <div className={styles.scoreHeader}>
              <h3 className={styles.scoreTitle}>Score</h3>
              <p className={styles.scoreHint}>Enter games per set. Add tiebreak points for 7-6 sets.</p>
            </div>

            <div className={styles.formGroup}>
              <label>Match Type:</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as MatchFormat })}
                className={styles.select}
              >
                <option value="bo3">Best of 3</option>
                <option value="bo5">Best of 5</option>
              </select>
            </div>

            <div className={styles.setGrid}>
              {Array.from({ length: maxSets }).map((_, i) => {
                const showTb = shouldShowTiebreak(i);
                return (
                  <div key={i} className={styles.setRow}>
                    <div className={styles.setLabel}>Set {i + 1}</div>
                    <div className={styles.setInputs}>
                      <div>
                        <span className={styles.smallLabel}>Games</span>
                        <div className={styles.gamesPair}>
                          <input
                            inputMode="numeric"
                            placeholder="You"
                            value={formData.sets[i].userGames}
                            onChange={(e) => updateSet(i, { userGames: e.target.value })}
                            className={styles.scoreInput}
                          />
                          <div className={styles.divider}>-</div>
                          <input
                            inputMode="numeric"
                            placeholder="Opp"
                            value={formData.sets[i].oppGames}
                            onChange={(e) => updateSet(i, { oppGames: e.target.value })}
                            className={styles.scoreInput}
                          />
                        </div>
                      </div>

                      {showTb && (
                        <div className={styles.tiebreakArea}>
                          <span className={styles.smallLabel}>Tiebreak (if 7-6)</span>
                          <div className={styles.gamesPair}>
                            <input
                              inputMode="numeric"
                              placeholder="You"
                              value={formData.sets[i].userTb}
                              onChange={(e) => updateSet(i, { userTb: e.target.value })}
                              className={styles.scoreInput}
                            />
                            <div className={styles.divider}>-</div>
                            <input
                              inputMode="numeric"
                              placeholder="Opp"
                              value={formData.sets[i].oppTb}
                              onChange={(e) => updateSet(i, { oppTb: e.target.value })}
                              className={styles.scoreInput}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {scoreError && <div className={styles.validationError}>{scoreError}</div>}
          </div>

          <div className={styles.formGroup}>
            <label>Notes:</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className={styles.textarea}
            />
          </div>
          <button type="submit" disabled={saving} className={styles.submitButton}>
            {saving ? 'Saving...' : (editingMatch ? 'Update' : 'Save')}
          </button>
        </form>
      )}

      <div className={styles.itemsList}>
        {matches.length === 0 ? (
          <p className={styles.emptyState}>No matches recorded yet.</p>
        ) : (
          matches.map((match) => (
            <div key={match.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <h3>vs {match.opponentName}</h3>
                <span className={`${styles.badge} ${match.result === 'win' ? styles.badgeWin : styles.badgeLoss}`}>
                  {match.result === 'win' ? 'Win' : 'Loss'}
                </span>
              </div>
              <div className={styles.itemMeta}>
                {formatHumanDate(match.matchDate)} {match.location && `• ${match.location}`} {match.surface && `• ${match.surface}`}
              </div>
              <div className={styles.itemContent}>
                {match.matchScore && (
                  <div className={styles.scoreTableWrapper}>
                    <div className={styles.scoreTitle}>Score</div>
                    <table className={styles.scoreTable}>
                      <thead>
                        <tr>
                          <th>Set</th>
                          <th>You</th>
                          <th>Opp</th>
                          <th>TB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderSetRows(parseMatchScoreString(match.matchScore))}
                      </tbody>
                    </table>
                  </div>
                )}
                {match.opponentUtr && <p><strong>Opponent UTR:</strong> {match.opponentUtr}</p>}
                {match.notes && <p>{match.notes}</p>}
              </div>
              <div className={styles.itemActions}>
                <button onClick={() => handleEdit(match)}>Edit</button>
                <button onClick={() => handleDelete(match.id)} className={styles.deleteButton}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Matches;
