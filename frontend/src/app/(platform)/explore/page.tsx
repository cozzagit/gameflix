'use client';

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useGames, useCategories } from '@/lib/hooks/use-games';
import { GameList } from '@/components/game/game-list';
import type { CategorySlug } from '@/lib/types';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Più giocati' },
  { value: 'newest', label: 'Più recenti' },
  { value: 'rating', label: 'Più apprezzati' },
];

export default function ExplorePage() {
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<'popular' | 'newest' | 'rating'>('popular');
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: categories } = useCategories();

  const categoryTabs = useMemo(() => {
    if (!categories) return [];

    const totalGames = categories.reduce((sum, c) => sum + c._count.games, 0);

    return [
      { value: 'all', label: 'Tutti', count: totalGames, color: '' },
      ...categories.map((c) => ({
        value: c.slug,
        label: c.name,
        count: c._count.games,
        color: c.color,
      })),
    ];
  }, [categories]);

  const filters = useMemo(() => ({
    category: category !== 'all' ? (category as CategorySlug) : undefined,
    difficulty: difficulty ?? undefined,
    sort,
    search: debouncedSearch || undefined,
    perPage: 24,
  }), [category, difficulty, sort, debouncedSearch]);

  const { data, isLoading } = useGames(filters);
  const games = data?.data ?? [];
  const totalCount = data?.meta?.total ?? games.length;

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    const id = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(id);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gameflix-text-bright mb-6">Esplora</h1>

      {/* Filtri */}
      <div className="space-y-4 mb-8">
        {/* Ricerca */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gameflix-text-dim" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cerca giochi..."
            className="w-full bg-gameflix-surface border border-gameflix-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gameflix-text placeholder:text-gameflix-text-dim focus:outline-none focus:ring-2 focus:ring-gameflix-primary/50 focus:border-gameflix-primary transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Tab categorie con conteggio */}
          <div className="flex gap-1 bg-gameflix-surface rounded-xl p-1">
            {categoryTabs.map((tab) => {
              const isActive = category === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setCategory(tab.value)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                    ${isActive
                      ? 'bg-gameflix-primary text-gameflix-bg shadow-md'
                      : 'text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-card'
                    }
                  `}
                  style={isActive && tab.color ? { backgroundColor: tab.color } : undefined}
                >
                  {tab.label}
                  <span
                    className={`
                      inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold
                      ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gameflix-card text-gameflix-text-dim'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtro difficoltà */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gameflix-text-dim" />
            <select
              value={difficulty ?? ''}
              onChange={(e) => setDifficulty(e.target.value ? Number(e.target.value) : null)}
              className="bg-gameflix-surface border border-gameflix-border rounded-xl px-3 py-2 text-sm text-gameflix-text focus:outline-none focus:ring-2 focus:ring-gameflix-primary/50 cursor-pointer"
            >
              <option value="">Difficoltà</option>
              <option value="1">Facile</option>
              <option value="2">Medio-Facile</option>
              <option value="3">Medio</option>
              <option value="4">Difficile</option>
              <option value="5">Estremo</option>
            </select>
          </div>

          {/* Ordinamento */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'popular' | 'newest' | 'rating')}
            className="bg-gameflix-surface border border-gameflix-border rounded-xl px-3 py-2 text-sm text-gameflix-text focus:outline-none focus:ring-2 focus:ring-gameflix-primary/50 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conteggio risultati */}
      {!isLoading && (
        <p className="text-sm text-gameflix-text-dim mb-4">
          {totalCount} gioch{totalCount === 1 ? 'o' : 'i'} trovat{totalCount === 1 ? 'o' : 'i'}
        </p>
      )}

      {/* Griglia giochi */}
      <GameList games={games} isLoading={isLoading} />
    </div>
  );
}
