import type { 
  AuthResponse, 
  UserPreferences, 
  JournalEntry, 
  TennisMatch, 
  LoginCredentials, 
  RegisterData,
  ApiError 
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' })) as ApiError;
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // Auth
  login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  register(data: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Preferences
  getPreferences(): Promise<UserPreferences | null> {
    return this.request<UserPreferences | null>('/preferences');
  }

  savePreferences(preferences: UserPreferences): Promise<{ message: string }> {
    return this.request<{ message: string }>('/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  // Journal
  getJournalEntries(): Promise<JournalEntry[]> {
    return this.request<JournalEntry[]>('/journal');
  }

  createJournalEntry(entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>('/journal', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  updateJournalEntry(id: number, entry: Partial<JournalEntry>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  }

  deleteJournalEntry(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/journal/${id}`, {
      method: 'DELETE',
    });
  }

  // Matches
  getMatches(): Promise<TennisMatch[]> {
    return this.request<TennisMatch[]>('/matches');
  }

  createMatch(match: Omit<TennisMatch, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>('/matches', {
      method: 'POST',
      body: JSON.stringify(match),
    });
  }

  updateMatch(id: number, match: Partial<TennisMatch>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(match),
    });
  }

  deleteMatch(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/matches/${id}`, {
      method: 'DELETE',
    });
  }

  // UTR
  getMyUtr(): Promise<{ utrRating: number; profileUrl: string; note: string }> {
    return this.request<{ utrRating: number; profileUrl: string; note: string }>('/utr/my-utr');
  }

  updateUtr(utrData: { utrRating: number; utrProfileUrl: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/utr/my-utr', {
      method: 'PUT',
      body: JSON.stringify(utrData),
    });
  }
}

export const api = new ApiService();
