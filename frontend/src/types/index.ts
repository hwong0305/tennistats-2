export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
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
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
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
