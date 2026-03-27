'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { UserProgress, UserActivity, UserBadge, GameSession, ApiResponse, ApiListResponse } from '@/lib/types';
import { useAuth } from './use-auth';

export function useUserProgress() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserProgress>>('/user/progress');
      return data.data;
    },
    enabled: isAuthenticated,
  });
}

export function useUserBadges(username?: string) {
  return useQuery({
    queryKey: ['user-badges', username],
    queryFn: async () => {
      const endpoint = username ? `/users/${username}/badges` : '/user/badges';
      const { data } = await api.get<ApiResponse<UserBadge[]>>(endpoint);
      return data.data;
    },
  });
}

export function useUserActivity(username?: string) {
  return useQuery({
    queryKey: ['user-activity', username],
    queryFn: async () => {
      const endpoint = username ? `/users/${username}/activity` : '/user/activity';
      const { data } = await api.get<ApiListResponse<UserActivity>>(endpoint);
      return data.data;
    },
  });
}

export function useRecentSessions() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['recent-sessions'],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<GameSession>>('/user/sessions?perPage=5');
      return data.data;
    },
    enabled: isAuthenticated,
  });
}

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['user-profile', username],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{
        user: {
          id: string;
          displayName: string;
          username: string;
          avatarUrl: string | null;
          totalXp: number;
          currentLevel: number;
          streakDays: number;
          createdAt: string;
          gamesCompleted: number;
          globalRank: number;
        };
        badges: UserBadge[];
        recentActivity: UserActivity[];
        favoriteGames: { gameSlug: string; gameTitle: string; playCount: number }[];
      }>>(`/users/${username}`);
      return data.data;
    },
    enabled: !!username,
  });
}
