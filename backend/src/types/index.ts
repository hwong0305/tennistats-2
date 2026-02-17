export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  role: 'student' | 'coach';
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: number;
  userId: number;
  primaryHand: 'right' | 'left' | 'ambidextrous' | null;
  playStyle: string | null;
  backhandType: 'one-handed' | 'two-handed' | null;
  utrRating: number | null;
  utrProfileUrl: string | null;
}

export interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  content: string | null;
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
  location: string | null;
  surface: 'hard' | 'clay' | 'grass' | 'carpet' | null;
  userSetsWon: number | null;
  opponentSetsWon: number | null;
  matchScore: string | null;
  result: 'win' | 'loss' | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UtrHistory {
  id: number;
  userId: number;
  rating: number;
  recordedAt: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'student' | 'coach';
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}
