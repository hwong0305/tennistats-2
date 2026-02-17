import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { JournalEntry, MatchComment, ProfileComment, TennisMatch, UserPreferences } from '../types';
import { formatHumanDate } from '../utils/date';
import styles from './CoachStudent.module.css';

interface ProfileData {
  student: { id: number; email: string; firstName: string; lastName: string };
  preferences: UserPreferences | null;
  comments: ProfileComment[];
}

const JOURNAL_PAGE_SIZE = 6;
const MATCH_PAGE_SIZE = 8;

const CoachStudent: React.FC = () => {
  const { user } = useAuth();
  const { studentId } = useParams();
  const parsedId = Number.parseInt(studentId || '', 10);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileComment, setProfileComment] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string>('');

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [journalPage, setJournalPage] = useState<number>(1);
  const [journalTotal, setJournalTotal] = useState<number>(0);
  const [journalPageSize, setJournalPageSize] = useState<number>(JOURNAL_PAGE_SIZE);
  const [journalLoading, setJournalLoading] = useState<boolean>(true);
  const [journalDrafts, setJournalDrafts] = useState<Record<number, string>>({});

  const [matches, setMatches] = useState<TennisMatch[]>([]);
  const [matchPage, setMatchPage] = useState<number>(1);
  const [matchTotal, setMatchTotal] = useState<number>(0);
  const [matchPageSize, setMatchPageSize] = useState<number>(MATCH_PAGE_SIZE);
  const [matchLoading, setMatchLoading] = useState<boolean>(true);
  const [matchDrafts, setMatchDrafts] = useState<Record<number, string>>({});

  const loadProfile = async (): Promise<void> => {
    if (!Number.isFinite(parsedId)) return;
    setProfileLoading(true);
    setProfileError('');
    try {
      const data = await api.getCoachStudentProfile(parsedId);
      setProfile(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      console.error('Failed to load profile:', err);
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadJournals = async (): Promise<void> => {
    if (!Number.isFinite(parsedId)) return;
    setJournalLoading(true);
    try {
      const data = await api.getCoachStudentJournals(parsedId, { page: journalPage, pageSize: JOURNAL_PAGE_SIZE, sort: 'date-desc' });
      setJournals(data.items);
      setJournalTotal(data.total);
      setJournalPageSize(data.pageSize);
      if (journalPage > 1 && data.items.length === 0) {
        setJournalPage(Math.max(1, Math.ceil(data.total / data.pageSize)));
      }
    } catch (err: unknown) {
      console.error('Failed to load journals:', err);
    } finally {
      setJournalLoading(false);
    }
  };

  const loadMatches = async (): Promise<void> => {
    if (!Number.isFinite(parsedId)) return;
    setMatchLoading(true);
    try {
      const data = await api.getCoachStudentMatches(parsedId, { page: matchPage, pageSize: MATCH_PAGE_SIZE, sort: 'date-desc' });
      setMatches(data.items);
      setMatchTotal(data.total);
      setMatchPageSize(data.pageSize);
      if (matchPage > 1 && data.items.length === 0) {
        setMatchPage(Math.max(1, Math.ceil(data.total / data.pageSize)));
      }
    } catch (err: unknown) {
      console.error('Failed to load matches:', err);
    } finally {
      setMatchLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'coach') {
      loadProfile();
    }
  }, [user?.role, parsedId]);

  useEffect(() => {
    if (user?.role === 'coach') {
      loadJournals();
    }
  }, [user?.role, parsedId, journalPage]);

  useEffect(() => {
    if (user?.role === 'coach') {
      loadMatches();
    }
  }, [user?.role, parsedId, matchPage]);

  const journalTotalPages = useMemo(() => Math.max(1, Math.ceil(journalTotal / journalPageSize)), [journalTotal, journalPageSize]);
  const matchTotalPages = useMemo(() => Math.max(1, Math.ceil(matchTotal / matchPageSize)), [matchTotal, matchPageSize]);

  const handleProfileComment = async (): Promise<void> => {
    if (!profileComment.trim() || !Number.isFinite(parsedId)) return;
    try {
      await api.createCoachProfileComment(parsedId, profileComment.trim());
      setProfileComment('');
      loadProfile();
    } catch (err: unknown) {
      console.error('Failed to add profile comment:', err);
    }
  };

  const handleJournalComment = async (entryId: number): Promise<void> => {
    const draft = journalDrafts[entryId];
    if (!draft || !draft.trim()) return;
    try {
      await api.createCoachJournalComment(parsedId, entryId, draft.trim());
      setJournalDrafts(prev => ({ ...prev, [entryId]: '' }));
      loadJournals();
    } catch (err: unknown) {
      console.error('Failed to add journal comment:', err);
    }
  };

  const handleMatchComment = async (matchId: number): Promise<void> => {
    const draft = matchDrafts[matchId];
    if (!draft || !draft.trim()) return;
    try {
      await api.createCoachMatchComment(parsedId, matchId, draft.trim());
      setMatchDrafts(prev => ({ ...prev, [matchId]: '' }));
      loadMatches();
    } catch (err: unknown) {
      console.error('Failed to add match comment:', err);
    }
  };

  if (!Number.isFinite(parsedId)) {
    return (
      <div className={styles.container}>
        <div className={styles.backButton}>
          <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
        </div>
        <p className={styles.emptyState}>Invalid student ID.</p>
      </div>
    );
  }

  if (user?.role !== 'coach') {
    return (
      <div className={styles.container}>
        <div className={styles.backButton}>
          <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
        </div>
        <p className={styles.emptyState}>Coach access only.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
      </div>
      <div className={styles.header}>
        <h2 className={styles.title}>Student Overview</h2>
        <p className={styles.subtitle}>Review profile details, journals, and matches.</p>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Profile</h3>
        {profileLoading ? (
          <p className={styles.emptyState}>Loading profile...</p>
        ) : profileError ? (
          <p className={styles.emptyState}>{profileError}</p>
        ) : !profile ? (
          <p className={styles.emptyState}>Profile not available.</p>
        ) : (
          <div className={styles.profileGrid}>
            <div className={styles.card}>
              <strong>{profile.student.firstName || 'Student'} {profile.student.lastName || ''}</strong>
              <p className={styles.meta}>{profile.student.email}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.meta}><strong>Primary hand:</strong> {profile.preferences?.primaryHand || 'Not set'}</p>
              <p className={styles.meta}><strong>Play style:</strong> {profile.preferences?.playStyle || 'Not set'}</p>
              <p className={styles.meta}><strong>Backhand:</strong> {profile.preferences?.backhandType || 'Not set'}</p>
              <p className={styles.meta}><strong>UTR:</strong> {profile.preferences?.utrRating ?? 'Not set'}</p>
            </div>
          </div>
        )}

        {profile && (
          <>
            <div className={styles.commentForm}>
              <textarea
                className={styles.textarea}
                value={profileComment}
                onChange={(e) => setProfileComment(e.target.value)}
                placeholder="Add a profile note..."
              />
              <button type="button" className={styles.button} onClick={handleProfileComment} disabled={!profileComment.trim()}>
                Add comment
              </button>
            </div>

            {profile.comments && profile.comments.length > 0 && (
              <div className={styles.commentList}>
                {profile.comments.map(comment => (
                  <div key={comment.id} className={styles.commentItem}>
                    <div>{comment.content}</div>
                    <div className={styles.commentMeta}>
                      {comment.coach?.firstName || 'Coach'} · {formatHumanDate(comment.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Journals</h3>
        <div className={styles.pagination}>
          <span>Page {Math.min(journalPage, journalTotalPages)} of {journalTotalPages}</span>
          <div className={styles.paginationControls}>
            <button type="button" onClick={() => setJournalPage(Math.max(1, journalPage - 1))} disabled={journalPage <= 1}>Prev</button>
            <button type="button" onClick={() => setJournalPage(Math.min(journalTotalPages, journalPage + 1))} disabled={journalPage >= journalTotalPages}>Next</button>
          </div>
        </div>
        {journalLoading ? (
          <p className={styles.emptyState}>Loading journals...</p>
        ) : journals.length === 0 ? (
          <p className={styles.emptyState}>No journal entries yet.</p>
        ) : (
          <div className={styles.list}>
            {journals.map(entry => (
              <div key={entry.id} className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <strong>{entry.title}</strong>
                  <span className={styles.entryMeta}>{formatHumanDate(entry.entryDate)}</span>
                </div>
                {entry.content && <p className={styles.preWrap}>{entry.content}</p>}

                {entry.comments && entry.comments.length > 0 && (
                  <div className={styles.commentList}>
                    {entry.comments.map(comment => (
                      <div key={comment.id} className={styles.commentItem}>
                        <div>{comment.content}</div>
                        <div className={styles.commentMeta}>
                          {comment.coach?.firstName || 'Coach'} · {formatHumanDate(comment.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.commentForm}>
                  <textarea
                    className={styles.textarea}
                    value={journalDrafts[entry.id] || ''}
                    onChange={(e) => setJournalDrafts(prev => ({ ...prev, [entry.id]: e.target.value }))}
                    placeholder="Add a journal comment..."
                  />
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => handleJournalComment(entry.id)}
                    disabled={!journalDrafts[entry.id]?.trim()}
                  >
                    Add comment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Matches</h3>
        <div className={styles.pagination}>
          <span>Page {Math.min(matchPage, matchTotalPages)} of {matchTotalPages}</span>
          <div className={styles.paginationControls}>
            <button type="button" onClick={() => setMatchPage(Math.max(1, matchPage - 1))} disabled={matchPage <= 1}>Prev</button>
            <button type="button" onClick={() => setMatchPage(Math.min(matchTotalPages, matchPage + 1))} disabled={matchPage >= matchTotalPages}>Next</button>
          </div>
        </div>
        {matchLoading ? (
          <p className={styles.emptyState}>Loading matches...</p>
        ) : matches.length === 0 ? (
          <p className={styles.emptyState}>No matches recorded yet.</p>
        ) : (
          <div className={styles.list}>
            {matches.map(match => (
              <div key={match.id} className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <strong>vs {match.opponentName}</strong>
                  <span className={styles.entryMeta}>{formatHumanDate(match.matchDate)}</span>
                </div>
                <p className={styles.meta}>{match.matchScore || 'Score not recorded'} · {match.result || 'Result unknown'}</p>
                {match.notes && <p className={styles.preWrap}>{match.notes}</p>}

                {match.comments && match.comments.length > 0 && (
                  <div className={styles.commentList}>
                    {match.comments.map((comment: MatchComment) => (
                      <div key={comment.id} className={styles.commentItem}>
                        <div>{comment.content}</div>
                        <div className={styles.commentMeta}>
                          {comment.coach?.firstName || 'Coach'} · {formatHumanDate(comment.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.commentForm}>
                  <textarea
                    className={styles.textarea}
                    value={matchDrafts[match.id] || ''}
                    onChange={(e) => setMatchDrafts(prev => ({ ...prev, [match.id]: e.target.value }))}
                    placeholder="Add a match comment..."
                  />
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => handleMatchComment(match.id)}
                    disabled={!matchDrafts[match.id]?.trim()}
                  >
                    Add comment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CoachStudent;
