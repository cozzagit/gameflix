'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Trophy,
  CalendarClock,
  Crown,
  TrendingUp,
  Gamepad2,
} from 'lucide-react';
import { cn, getCategoryColor, formatNumber } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Esplora', icon: Compass },
  { href: '/leaderboard', label: 'Classifiche', icon: Trophy },
  { href: '/releases', label: 'Uscite', icon: CalendarClock },
];

const WORLDS = [
  { slug: 'brainlab' as const, label: 'BrainLab', available: true },
  { slug: 'wordforge' as const, label: 'WordForge', available: false },
  { slug: 'quizarena' as const, label: 'QuizArena', available: false },
];

const TRENDING_GAMES = [
  { slug: 'memory-matrix', title: 'Memory Matrix', plays: 2450 },
  { slug: 'number-rush', title: 'Number Rush', plays: 1830 },
  { slug: 'pattern-pro', title: 'Pattern Pro', plays: 1520 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isPremium } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-gameflix-border bg-gameflix-bg h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
      <nav className="flex-1 py-4 px-3 space-y-1">
        {/* Main navigation */}
        {NAV_LINKS.map((link) => {
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gameflix-primary/10 text-gameflix-primary'
                  : 'text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-surface'
              )}
            >
              <link.icon className={cn('w-5 h-5', isActive && 'text-gameflix-primary')} />
              {link.label}
            </Link>
          );
        })}

        {/* Worlds section */}
        <div className="pt-4">
          <div className="h-px bg-gameflix-border mx-2 mb-4" />
          <p className="px-3 text-[10px] font-bold text-gameflix-text-dim uppercase tracking-widest mb-2">
            I Mondi
          </p>
          {WORLDS.map((world) => {
            const colors = getCategoryColor(world.slug);
            const isActive = pathname === `/worlds/${world.slug}`;
            return (
              <Link
                key={world.slug}
                href={world.available ? `/worlds/${world.slug}` : '#'}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? `${colors.bg} ${colors.text}`
                    : world.available
                      ? 'text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-surface'
                      : 'text-gameflix-text-dim/50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
                  {world.label}
                </div>
                {!world.available && (
                  <Badge variant="coming-soon" className="text-[9px] px-1.5 py-0.5">
                    SOON
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>

        {/* Trending section */}
        <div className="pt-4">
          <div className="h-px bg-gameflix-border mx-2 mb-4" />
          <p className="px-3 text-[10px] font-bold text-gameflix-text-dim uppercase tracking-widest mb-2">
            Trending
          </p>
          {TRENDING_GAMES.map((game, i) => (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-gameflix-surface transition-colors group"
            >
              <span className="text-gameflix-text-dim text-xs font-mono w-4">{i + 1}</span>
              <div className="w-8 h-8 rounded-lg bg-gameflix-surface border border-gameflix-border flex items-center justify-center shrink-0">
                <Gamepad2 className="w-4 h-4 text-gameflix-text-dim" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gameflix-text group-hover:text-gameflix-text-bright truncate transition-colors">
                  {game.title}
                </p>
                <p className="text-[11px] text-gameflix-text-dim flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {formatNumber(game.plays)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* Premium CTA */}
      {!isPremium && (
        <div className="p-3">
          <div className="bg-gradient-to-br from-gameflix-secondary/20 to-gameflix-primary/10 rounded-2xl border border-gameflix-secondary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-gameflix-accent" />
              <p className="text-sm font-bold text-gameflix-text-bright">Passa a Premium</p>
            </div>
            <p className="text-xs text-gameflix-text-dim mb-3">
              Sblocca tutti i giochi, niente pubblicità e sfide esclusive.
            </p>
            <Link href="/pricing">
              <Button size="sm" variant="accent" fullWidth>
                Scopri i vantaggi
              </Button>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
