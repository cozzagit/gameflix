import { create } from 'zustand';
import api from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  loadFromStorage: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isPremium: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, tokens } = data;
      localStorage.setItem('gameflix_token', tokens.accessToken);
      localStorage.setItem('gameflix_refresh_token', tokens.refreshToken);
      set({
        user,
        token: tokens.accessToken,
        isAuthenticated: true,
        isPremium: false,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        displayName,
      });
      const { user, tokens } = data;
      localStorage.setItem('gameflix_token', tokens.accessToken);
      localStorage.setItem('gameflix_refresh_token', tokens.refreshToken);
      set({
        user,
        token: tokens.accessToken,
        isAuthenticated: true,
        isPremium: false,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('gameflix_token');
    localStorage.removeItem('gameflix_refresh_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isPremium: false,
    });
  },

  setUser: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      isPremium: user.plan === 'premium',
    });
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('gameflix_token');
    if (token) {
      set({ token, isLoading: true });
      api.get('/users/me')
        .then(({ data }) => {
          set({
            user: data,
            isAuthenticated: true,
            isPremium: false,
            isLoading: false,
          });
        })
        .catch(() => {
          localStorage.removeItem('gameflix_token');
          localStorage.removeItem('gameflix_refresh_token');
          set({ token: null, isLoading: false });
        });
    }
  },

  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      set({
        user: updatedUser,
        isPremium: updatedUser.plan === 'premium',
      });
    }
  },
}));
