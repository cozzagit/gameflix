'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { Podium } from '@/components/leaderboard/podium';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { Card } from '@/components/ui/card';
import { UserRankRow } from '@/components/leaderboard/user-rank-row';
import type { LeaderboardEntry, LeaderboardPeriod, CategorySlug } from '@/lib/types';

const PERIOD_TABS = [
  { value: 'daily', label: 'Giornaliera' },
  { value: 'weekly', label: 'Settimanale' },
  { value: 'monthly', label: 'Mensile' },
  { value: 'alltime', label: 'Sempre' },
];

const CATEGORY_TABS = [
  { value: 'all', label: 'Tutti' },
  { value: 'brainlab', label: 'BrainLab' },
  { value: 'wordforge', label: 'WordForge' },
  { value: 'quizarena', label: 'QuizArena' },
];

const MOCK_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, userId: '1', displayName: 'MindMaster99', username: 'mindmaster99', avatarUrl: null, score: 12500, level: 12, streakDays: 45, isCurrentUser: false },
  { rank: 2, userId: '2', displayName: 'BrainStorm', username: 'brainstorm', avatarUrl: null, score: 11800, level: 11, streakDays: 32, isCurrentUser: false },
  { rank: 3, userId: '3', displayName: 'CogniPro', username: 'cognipro', avatarUrl: null, score: 10900, level: 10, streakDays: 28, isCurrentUser: false },
  { rank: 4, userId: '4', displayName: 'PuzzleKing', username: 'puzzleking', avatarUrl: null, score: 9800, level: 9, streakDays: 21, isCurrentUser: false },
  { rank: 5, userId: '5', displayName: 'LogicLion', username: 'logiclion', avatarUrl: null, score: 9200, level: 8, streakDays: 19, isCurrentUser: false },
  { rank: 6, userId: '6', displayName: 'QuizQueen', username: 'quizqueen', avatarUrl: null, score: 8800, level: 8, streakDays: 15, isCurrentUser: false },
  { rank: 7, userId: '7', displayName: 'MemoryPro', username: 'memorypro', avatarUrl: null, score: 8200, level: 7, streakDays: 18, isCurrentUser: false },
  { rank: 8, userId: '8', displayName: 'ThinkFast', username: 'thinkfast', avatarUrl: null, score: 7600, level: 7, streakDays: 12, isCurrentUser: false },
  { rank: 9, userId: '9', displayName: 'BrainWave', username: 'brainwave', avatarUrl: null, score: 7100, level: 6, streakDays: 10, isCurrentUser: false },
  { rank: 10, userId: '10', displayName: 'NeuralNet', username: 'neuralnet', avatarUrl: null, score: 6800, level: 6, streakDays: 14, isCurrentUser: false },
];

const MOCK_USER_ENTRY: LeaderboardEntry = {
  rank: 42, userId: 'me', displayName: 'Tu', username: 'me', avatarUrl: null, score: 2100, level: 4, streakDays: 7, isCurrentUser: true,
};

const MOCK_NEARBY: LeaderboardEntry[] = [
  { rank: 40, userId: '40', displayName: 'NeuroNinja', username: 'neuroninja', avatarUrl: null, score: 2200, level: 4, streakDays: 5, isCurrentUser: false },
  { rank: 41, userId: '41', displayName: 'SmartCat', username: 'smartcat', avatarUrl: null, score: 2150, level: 4, streakDays: 3, isCurrentUser: false },
  { rank: 42, userId: 'me', displayName: 'Tu', username: 'me', avatarUrl: null, score: 2100, level: 4, streakDays: 7, isCurrentUser: true },
  { rank: 43, userId: '43', displayName: 'QuickBrain', username: 'quickbrain', avatarUrl: null, score: 2050, level: 4, streakDays: 6, isCurrentUser: false },
  { rank: 44, userId: '44', displayName: 'MindSpark', username: 'mindspark', avatarUrl: null, score: 1980, level: 3, streakDays: 2, isCurrentUser: false },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<string>('weekly');
  const [category, setCategory] = useState<string>('all');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-7 h-7 text-gameflix-accent" />
        <h1 className="text-2xl font-bold text-gameflix-text-bright">Classifiche</h1>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-8">
        <Tabs tabs={PERIOD_TABS} activeTab={period} onTabChange={setPeriod} />
        <Tabs tabs={CATEGORY_TABS} activeTab={category} onTabChange={setCategory} />
      </div>

      {/* Podium */}
      <Card padding="none" className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-b from-gameflix-accent/5 to-transparent px-4">
          <Podium entries={MOCK_ENTRIES.slice(0, 3)} />
        </div>
      </Card>

      {/* Full Table */}
      <Card padding="sm" className="mb-6">
        <LeaderboardTable entries={MOCK_ENTRIES} />
      </Card>

      {/* Nearby Section */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gameflix-text-bright mb-3">Vicino a te</h2>
        <Card padding="sm">
          <div className="space-y-1">
            {MOCK_NEARBY.map((entry) => (
              <UserRankRow key={entry.userId} entry={entry} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
