/**
 * API Client for Maternal Health App
 * 
 * This module provides a centralized API client that communicates
 * with the backend server instead of directly accessing Supabase.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// API Base URL - use environment variable or default to localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Storage keys
const TOKEN_KEY = 'maternal_health_token';
const REFRESH_TOKEN_KEY = 'maternal_health_refresh_token';
const USER_KEY = 'maternal_health_user';

// Storage helper for web compatibility
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
};

// Types
export type UserRole = 'mother' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: any;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
}

export interface LoginResponse {
  message: string;
  user: User;
  session: Session;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  session: Session | null;
}

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  profile: any;
}

export interface ApiError {
  error: string;
  message?: string;
}

/**
 * API Client Class
 */
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadTokens();
  }

  /**
   * Load tokens from storage on initialization
   */
  private async loadTokens() {
    try {
      const [token, refresh] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(REFRESH_TOKEN_KEY),
      ]);
      this.accessToken = token;
      this.refreshToken = refresh;
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  /**
   * Save tokens to storage
   */
  private async saveTokens(session: Session) {
    try {
      this.accessToken = session.access_token;
      this.refreshToken = session.refresh_token;
      await Promise.all([
        storage.setItem(TOKEN_KEY, session.access_token),
        storage.setItem(REFRESH_TOKEN_KEY, session.refresh_token),
      ]);
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  /**
   * Clear tokens from storage
   */
  private async clearTokens() {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      await Promise.all([
        storage.removeItem(TOKEN_KEY),
        storage.removeItem(REFRESH_TOKEN_KEY),
        storage.removeItem(USER_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Save user to storage
   */
  private async saveUser(user: User) {
    try {
      await storage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }

  /**
   * Get stored user
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await storage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Failed to get stored user:', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Make API request with automatic token handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: ApiError | null }> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, try to refresh token
        if (response.status === 401 && this.refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry request with new token
            headers['Authorization'] = `Bearer ${this.accessToken}`;
            const retryResponse = await fetch(url, { ...options, headers });
            const retryData = await retryResponse.json();
            
            if (!retryResponse.ok) {
              return { data: null, error: retryData as ApiError };
            }
            return { data: retryData as T, error: null };
          }
        }
        return { data: null, error: data as ApiError };
      }

      return { data: data as T, error: null };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null,
        error: { error: 'Network error', message: 'Failed to connect to server' },
      };
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        await this.clearTokens();
        return false;
      }

      const data = await response.json();
      await this.saveTokens(data.session);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      return false;
    }
  }

  // ==========================================
  // AUTH METHODS
  // ==========================================

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ data: LoginResponse | null; error: ApiError | null }> {
    const result = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.session) {
      await this.saveTokens(result.data.session);
      await this.saveUser(result.data.user);
    }

    return result;
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    role: UserRole = 'mother',
    fullName?: string,
    phone?: string
  ): Promise<{ data: RegisterResponse | null; error: ApiError | null }> {
    const result = await this.request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, fullName, phone }),
    });

    if (result.data?.session) {
      await this.saveTokens(result.data.session);
    }

    return result;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<{ error: ApiError | null }> {
    const result = await this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });

    await this.clearTokens();
    return { error: result.error };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ error: ApiError | null }> {
    const result = await this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return { error: result.error };
  }

  /**
   * Reset password with new password
   */
  async resetPassword(password: string): Promise<{ error: ApiError | null }> {
    const result = await this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    return { error: result.error };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.accessToken) {
      await this.loadTokens();
    }
    return !!this.accessToken;
  }

  // ==========================================
  // PROFILE METHODS
  // ==========================================

  /**
   * Get current user profile
   */
  async getProfile(): Promise<{ data: ProfileResponse | null; error: ApiError | null }> {
    return this.request<ProfileResponse>('/api/profile');
  }

  /**
   * Update current user profile
   */
  async updateProfile(updates: Record<string, any>): Promise<{ data: any; error: ApiError | null }> {
    return this.request<{ message: string; profile: any }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Create profile for existing user without one
   */
  async createProfile(fullName?: string, phone?: string): Promise<{ data: any; error: ApiError | null }> {
    return this.request<{ message: string; profile: any }>('/api/profile/create', {
      method: 'POST',
      body: JSON.stringify({ fullName, phone }),
    });
  }

  // ==========================================
  // NOTIFICATIONS METHODS
  // ==========================================

  /**
   * Get user notifications
   */
  async getNotifications(): Promise<{ data: { notifications: any[]; unread_count: number } | null; error: ApiError | null }> {
    return this.request('/api/notifications');
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(id: string): Promise<{ error: ApiError | null }> {
    const result = await this.request<{ message: string }>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
    return { error: result.error };
  }

  // ==========================================
  // HEALTH CHECK
  // ==========================================

  /**
   * Check server health
   */
  async healthCheck(): Promise<{ status: string; timestamp: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
        return response.json();
      }
      return null;
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export class for testing
export { ApiClient };
