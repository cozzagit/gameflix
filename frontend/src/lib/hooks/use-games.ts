'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Game, GameRaw, ApiListResponse, ApiResponse, CategorySlug, GameRelease, DailyChallenge } from '@/lib/types';
import { normalizeGame } from '@/lib/types';

interface GamesFilters {
  category?: CategorySlug;
  difficulty?: number;
  sort?: 'popular' | 'newest' | 'rating';
  search?: string;
  page?: number;
  perPage?: number;
}

export function useGames(filters: GamesFilters = {}) {
  return useQuery({
    queryKey: ['games', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.difficulty) params.set('difficulty', String(filters.difficulty));
      const sortMap: Record<string, string> = { popular: 'popular', newest: 'recent', rating: 'rating' };
      if (filters.sort) params.set('sort', sortMap[filters.sort] || filters.sort);
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.perPage) params.set('limit', String(filters.perPage));
      const { data } = await api.get<ApiListResponse<GameRaw>>(`/games?${params.toString()}`);
      return {
        data: data.data.map(normalizeGame),
        meta: data.meta,
      };
    },
  });
}

export function useGameDetail(slug: string) {
  return useQuery({
    queryKey: ['game', slug],
    queryFn: async () => {
      const { data } = await api.get<GameRaw>(`/games/${slug}`);
      return normalizeGame(data);
    },
    enabled: !!slug,
  });
}

export function useGamesByCategory(categorySlug: CategorySlug) {
  return useQuery({
    queryKey: ['games', 'category', categorySlug],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<GameRaw>>(`/games?category=${categorySlug}`);
      return data.data.map(normalizeGame);
    },
    enabled: !!categorySlug,
  });
}

export function useTrendingGames() {
  return useQuery({
    queryKey: ['games', 'trending'],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<GameRaw>>('/games?sort=popular&limit=6');
      return data.data.map(normalizeGame);
    },
  });
}

export function useNewGames() {
  return useQuery({
    queryKey: ['games', 'new'],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<GameRaw>>('/games?sort=recent&limit=6');
      return data.data.map(normalizeGame);
    },
  });
}

export function useFeaturedGame() {
  return useQuery({
    queryKey: ['games', 'featured'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Game>>('/games/featured');
      return data.data;
    },
  });
}

export function useGameReleases() {
  return useQuery({
    queryKey: ['releases'],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<GameRelease>>('/releases');
      return data.data;
    },
  });
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  color: string;
  iconUrl: string | null;
  displayOrder: number;
  _count: { games: number };
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<CategoryWithCount[]>('/categories');
      return data;
    },
  });
}

export function useDailyChallenges() {
  return useQuery({
    queryKey: ['daily-challenges'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DailyChallenge[]>>('/daily-challenges');
      return data.data;
    },
  });
}
