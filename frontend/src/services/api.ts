import type { 
  AuthResponse, 
  UserPreferences, 
  JournalEntry, 
  TennisMatch, 
  LoginCredentials, 
  RegisterData,
  ApiError,
  PagedResponse,
  UtrHistory
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
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

  private normalizePaged<T>(data: PagedResponse<T> | T[], page: number, pageSize: number): PagedResponse<T> {
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page,
        pageSize,
      };
    }
    return data;
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

  getCurrentUser(): Promise<{ user: AuthResponse['user'] }> {
    return this.request<{ user: AuthResponse['user'] }>('/auth/me');
  }

  logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
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
  async getJournalEntries(params?: { page?: number; pageSize?: number; sort?: string }): Promise<PagedResponse<JournalEntry>> {
    const search = new URLSearchParams();
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 6;
    if (params?.page) search.set('page', String(params.page));
    if (params?.pageSize) search.set('pageSize', String(params.pageSize));
    if (params?.sort) search.set('sort', params.sort);
    const query = search.toString();
    const data = await this.request<PagedResponse<JournalEntry> | JournalEntry[]>(`/journal${query ? `?${query}` : ''}`);
    return this.normalizePaged(data, page, pageSize);
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
  async getMatches(params?: { page?: number; pageSize?: number; sort?: string }): Promise<PagedResponse<TennisMatch>> {
    const search = new URLSearchParams();
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 8;
    if (params?.page) search.set('page', String(params.page));
    if (params?.pageSize) search.set('pageSize', String(params.pageSize));
    if (params?.sort) search.set('sort', params.sort);
    const query = search.toString();
    const data = await this.request<PagedResponse<TennisMatch> | TennisMatch[]>(`/matches${query ? `?${query}` : ''}`);
    return this.normalizePaged(data, page, pageSize);
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

  getUtrHistory(): Promise<{ items: UtrHistory[] }> {
    return this.request<{ items: UtrHistory[] }>('/utr/history');
  }
}

export const api = new ApiService();
