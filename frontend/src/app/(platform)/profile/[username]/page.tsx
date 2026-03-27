'use client';

import { use } from 'react';
import {
  Flame,
  Gamepad2,
  Zap,
  Trophy,
  Calendar,
  Award,
  TrendingUp,
} from 'lucide-react';
import { cn, formatNumber, formatDate, formatDateRelative, getLevelTitle, getXpProgress } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ProgressBar } from '@/components/ui/progress-bar';
import { BadgeCard } from '@/components/gamification/badge-card';
import { LevelTitle } from '@/components/gamification/level-title';
import { StreakCounter } from '@/components/gamification/streak-counter';
import type { UserBadge, Badge } from '@/lib/types';

const MOCK_PROFILE = {
  user: {
    id: '1',
    displayName: 'Marco Rossi',
    username: 'marco_rossi',
    avatarUrl: null,
    totalXp: 4250,
    currentLevel: 5,
    streakDays: 12,
    createdAt: '2026-01-15T00:00:00Z',
    gamesCompleted: 145,
    globalRank: 42,
  },
  badges: [
    {
      badge: { id: '1', name: 'Primo Passo', description: 'Completa il tuo primo gioco', iconUrl: null, category: 'general', requiredValue: 1 },
      earnedAt: '2026-01-15T10:00:00Z',
    },
    {
      badge: { id: '2', name: 'Streak 7', description: 'Gioca 7 giorni consecutivi', iconUrl: null, category: 'streak', requiredValue: 7 },
      earnedAt: '2026-01-22T10:00:00Z',
    },
    {
      badge: { id: '3', name: 'Top 10', description: 'Entra nella top 10 di un gioco', iconUrl: null, category: 'leaderboard', requiredValue: 10 },
      earnedAt: '2026-02-05T10:00:00Z',
    },
    {
      badge: { id: '4', name: 'Esploratore', description: 'Gioca a 10 giochi diversi', iconUrl: null, category: 'exploration', requiredValue: 10 },
      earnedAt: '2026-02-15T10:00:00Z',
    },
  ] as UserBadge[],
  recentActivity: [
    { id: '1', type: 'game_played' as const, description: 'Ha giocato a Memory Matrix e ha ottenuto 4200 punti', metadata: {}, createdAt: '2026-03-26T08:30:00Z' },
    { id: '2', type: 'badge_earned' as const, description: 'Ha ottenuto il badge "Esploratore"', metadata: {}, createdAt: '2026-03-25T15:00:00Z' },
    { id: '3', type: 'level_up' as const, description: 'Salito al livello 5 - Giocatore', metadata: {}, createdAt: '2026-03-24T12:00:00Z' },
    { id: '4', type: 'game_played' as const, description: 'Ha giocato a Number Rush e ha ottenuto 3100 punti', metadata: {}, createdAt: '2026-03-24T09:00:00Z' },
    { id: '5', type: 'streak_milestone' as const, description: 'Ha raggiunto una streak di 10 giorni!', metadata: {}, createdAt: '2026-03-23T08:00:00Z' },
  ],
  favoriteGames: [
    { gameSlug: 'memory-matrix', gameTitle: 'Memory Matrix', playCount: 45 },
    { gameSlug: 'number-rush', gameTitle: 'Number Rush', playCount: 32 },
    { gameSlug: 'pattern-pro', gameTitle: 'Pattern Pro', playCount: 28 },
  ],
};

const LOCKED_BADGES: Badge[] = [
  { id: '5', name: 'Streak 30', description: 'Gioca 30 giorni consecutivi', iconUrl: null, category: 'streak', requiredValue: 30 },
  { id: '6', name: 'Campione', description: 'Raggiungi il livello 10', iconUrl: null, category: 'level', requiredValue: 10 },
  { id: '7', name: 'Leggenda', description: 'Raggiungi 100.000 XP totali', iconUrl: null, category: 'xp', requiredValue: 100000 },
];

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const profile = MOCK_PROFILE;
  const { user, badges, recentActivity, favoriteGames } = profile;
  const { xpInLevel, xpNeeded, percentage } = getXpProgress(user.totalXp, user.currentLevel);

  const activityIcons = {
    game_played: Gamepad2,
    badge_earned: Award,
    level_up: TrendingUp,
    streak_milestone: Flame,
  };

  const activityColors = {
    game_played: 'text-gameflix-primary',
    badge_earned: 'text-gameflix-accent',
    level_up: 'text-gameflix-secondary',
    streak_milestone: 'text-orange-400',
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl space-y-8">
      {/* Profile Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar src={user.avatarUrl} alt={user.displayName} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gameflix-text-bright">{user.displayName}</h1>
            <p className="text-sm text-gameflix-text-dim mb-1">@{user.username}</p>
            <LevelTitle level={user.currentLevel} className="text-base" />

            <div className="mt-3 max-w-xs">
              <div className="flex items-center justify-between text-xs text-gameflix-text-dim mb-1">
                <span>Livello {user.currentLevel}</span>
                <span>{xpInLevel} / {xpNeeded} XP</span>
              </div>
              <ProgressBar value={percentage} color="secondary" size="sm" />
            </div>

            <p className="text-xs text-gameflix-text-dim mt-3 flex items-center gap-1 justify-center sm:justify-start">
              <Calendar className="w-3 h-3" />
              Membro dal {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          value={user.streakDays}
          label="Streak"
          suffix="giorni"
        />
        <StatCard
          icon={<Gamepad2 className="w-5 h-5 text-gameflix-primary" />}
          value={user.gamesCompleted}
          label="Partite"
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-gameflix-secondary" />}
          value={user.totalXp}
          label="XP totali"
          format
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-gameflix-accent" />}
          value={user.globalRank}
          label="Posizione"
          prefix="#"
        />
      </div>

      {/* Badges */}
      <section>
        <h2 className="text-lg font-bold text-gameflix-text-bright mb-4">
          Badge ({badges.length})
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {badges.map((ub) => (
            <BadgeCard key={ub.badge.id} badge={ub.badge} earned={ub} />
          ))}
          {LOCKED_BADGES.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-bold text-gameflix-text-bright mb-4">Attività recente</h2>
        <Card padding="none">
          <div className="divide-y divide-gameflix-border">
            {recentActivity.map((activity) => {
              const IconComponent = activityIcons[activity.type];
              const colorClass = activityColors[activity.type];
              return (
                <div key={activity.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gameflix-surface', colorClass)}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gameflix-text">{activity.description}</p>
                    <p className="text-[11px] text-gameflix-text-dim">
                      {formatDateRelative(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Favorite Games */}
      <section>
        <h2 className="text-lg font-bold text-gameflix-text-bright mb-4">Giochi preferiti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {favoriteGames.map((game, i) => (
            <Card key={game.gameSlug} hover padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gameflix-surface flex items-center justify-center">
                  <span className="text-sm font-bold text-gameflix-text-dim">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gameflix-text-bright truncate">
                    {game.gameTitle}
                  </p>
                  <p className="text-xs text-gameflix-text-dim">
                    {game.playCount} partite
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  prefix,
  suffix,
  format,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  format?: boolean;
}) {
  return (
    <Card hover className="text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gameflix-text-bright">
        {prefix}
        {format ? formatNumber(value) : value}
      </p>
      <p className="text-xs text-gameflix-text-dim">
        {label} {suffix}
      </p>
    </Card>
  );
}
