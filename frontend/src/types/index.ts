export type UserRole = 'student' | 'coach';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UserPreferences {
  id?: number;
  userId?: number;
  primaryHand: 'right' | 'left' | 'ambidextrous' | '';
  playStyle: string;
  backhandType: 'one-handed' | 'two-handed' | '';
  utrRating: number | null;
  utrProfileUrl: string;
}

export interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  content: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
  comments?: JournalComment[];
}

export interface TennisMatch {
  id: number;
  userId: number;
  opponentName: string;
  opponentUtr: number | null;
  matchDate: string;
  location: string;
  surface: 'hard' | 'clay' | 'grass' | 'carpet' | '';
  userSetsWon: number | null;
  opponentSetsWon: number | null;
  matchScore: string;
  result: 'win' | 'loss' | '';
  notes: string;
  createdAt: string;
  updatedAt: string;
  comments?: MatchComment[];
}

export interface UtrHistory {
  id: number;
  userId: number;
  rating: number;
  recordedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface CoachInvite {
  id: number;
  studentId: number;
  coachId: number | null;
  coachEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
  coach?: User;
  student?: User;
}

export interface CoachStudent {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ProfileComment {
  id: number;
  studentId: number;
  coachId: number;
  content: string;
  createdAt: string;
  coach?: User;
}

export interface JournalComment {
  id: number;
  journalEntryId: number;
  studentId: number;
  coachId: number;
  content: string;
  createdAt: string;
  coach?: User;
}

export interface MatchComment {
  id: number;
  matchId: number;
  studentId: number;
  coachId: number;
  content: string;
  createdAt: string;
  coach?: User;
}

export interface ApiError {
  error: string;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
