'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { LeaderboardEntry, ApiResponse, CategorySlug, LeaderboardPeriod } from '@/lib/types';

interface LeaderboardFilters {
  period?: LeaderboardPeriod;
  category?: CategorySlug | 'all';
  gameSlug?: string;
  limit?: number;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  nearbyEntries: LeaderboardEntry[];
}

export function useLeaderboard(filters: LeaderboardFilters = {}) {
  return useQuery({
    queryKey: ['leaderboard', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.period) params.set('period', filters.period);
      if (filters.category && filters.category !== 'all') params.set('category', filters.category);
      if (filters.gameSlug) params.set('gameSlug', filters.gameSlug);
      if (filters.limit) params.set('limit', String(filters.limit));
      const { data } = await api.get<ApiResponse<LeaderboardData>>(`/leaderboard?${params.toString()}`);
      return data.data;
    },
  });
}

export function useGameLeaderboard(gameSlug: string, limit: number = 10) {
  return useQuery({
    queryKey: ['leaderboard', 'game', gameSlug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LeaderboardData>>(
        `/leaderboard?gameSlug=${gameSlug}&limit=${limit}`
      );
      return data.data;
    },
    enabled: !!gameSlug,
  });
}
