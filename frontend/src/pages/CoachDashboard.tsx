import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { CoachInvite, CoachStudent } from '../types';
import styles from './CoachDashboard.module.css';

const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pendingInvites, setPendingInvites] = useState<CoachInvite[]>([]);
  const [students, setStudents] = useState<CoachStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [invitesData, studentsData] = await Promise.all([
        api.getCoachPendingInvites(),
        api.getCoachStudents(),
      ]);
      setPendingInvites(invitesData.invites || []);
      setStudents(studentsData.students || []);
    } catch (err: unknown) {
      console.error('Failed to load coach dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'coach') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  const handleInviteAction = async (inviteId: number, action: 'accept' | 'decline'): Promise<void> => {
    try {
      if (action === 'accept') {
        await api.acceptCoachInvite(inviteId);
      } else {
        await api.declineCoachInvite(inviteId);
      }
      loadData();
    } catch (err: unknown) {
      console.error('Failed to update invite:', err);
    }
  };

  if (user?.role !== 'coach') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Coach Dashboard</h2>
          <p className={styles.subtitle}>This page is only available to coach accounts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Coach Dashboard</h2>
        <p className={styles.subtitle}>Review student invites and follow progress updates.</p>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Pending invites</h3>
        {pendingInvites.length === 0 ? (
          <p className={styles.emptyState}>No pending invites right now.</p>
        ) : (
          <div className={styles.inviteList}>
            {pendingInvites.map(invite => (
              <div key={invite.id} className={styles.inviteCard}>
                <strong>{invite.student?.firstName || 'Student'} {invite.student?.lastName || ''}</strong>
                <span className={styles.meta}>{invite.student?.email}</span>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.acceptButton}`}
                    onClick={() => handleInviteAction(invite.id, 'accept')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.declineButton}`}
                    onClick={() => handleInviteAction(invite.id, 'decline')}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Your students</h3>
        {students.length === 0 ? (
          <p className={styles.emptyState}>No students yet. Accept an invite to get started.</p>
        ) : (
          <div className={styles.studentGrid}>
            {students.map(student => (
              <div key={student.id} className={styles.studentCard}>
                <strong>{student.firstName || 'Student'} {student.lastName || ''}</strong>
                <span className={styles.meta}>{student.email}</span>
                <Link to={`/coach/students/${student.id}`} className={styles.studentLink}>
                  View profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CoachDashboard;
