'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  Brain,
  BookOpen,
  HelpCircle,
  Play,
  Gamepad2,
  Users,
  Trophy,
} from 'lucide-react';
import { cn, getCategoryColor, formatNumber } from '@/lib/utils';
import { useGamesByCategory } from '@/lib/hooks/use-games';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameList } from '@/components/game/game-list';
import type { CategorySlug } from '@/lib/types';

const WORLD_DATA: Record<
  string,
  {
    slug: CategorySlug;
    name: string;
    tagline: string;
    description: string;
    icon: typeof Brain;
    stats: { players: number; games: number; dailyPlays: number };
  }
> = {
  brainlab: {
    slug: 'brainlab',
    name: 'BrainLab',
    tagline: 'Allena logica, memoria e velocità di pensiero',
    description:
      'BrainLab è il laboratorio dove le tue capacità cognitive vengono messe alla prova. Puzzle logici, esercizi di memoria e sfide di velocità ti aspettano ogni giorno.',
    icon: Brain,
    stats: { players: 12500, games: 8, dailyPlays: 3400 },
  },
  wordforge: {
    slug: 'wordforge',
    name: 'WordForge',
    tagline: 'Forgia le parole, padroneggia il linguaggio',
    description:
      'WordForge è la fucina delle parole. Anagrammi, catene di parole e giochi linguistici per espandere il tuo vocabolario e la tua agilità verbale.',
    icon: BookOpen,
    stats: { players: 8200, games: 6, dailyPlays: 2100 },
  },
  quizarena: {
    slug: 'quizarena',
    name: 'QuizArena',
    tagline: 'Sfida la tua conoscenza, domina il sapere',
    description:
      'QuizArena è il campo di battaglia della conoscenza. Quiz di cultura generale, domande specialistiche e sfide a tempo per dimostrare quanto ne sai.',
    icon: HelpCircle,
    stats: { players: 9800, games: 5, dailyPlays: 2800 },
  },
};

export default function WorldPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const world = WORLD_DATA[slug];

  if (!world) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gameflix-text-bright mb-2">Mondo non trovato</h1>
        <p className="text-gameflix-text-dim">Questo mondo non esiste ancora.</p>
      </div>
    );
  }

  const isComingSoon = slug !== 'brainlab';

  return (
    <div className="max-w-6xl">
      <WorldHeader world={world} />
      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        {isComingSoon ? (
          <ComingSoonSection world={world} />
        ) : (
          <ActiveWorldContent world={world} />
        )}
      </div>
    </div>
  );
}

function WorldHeader({ world }: { world: typeof WORLD_DATA[string] }) {
  const colors = getCategoryColor(world.slug);
  const IconComponent = world.icon;

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-r', colors.gradient, 'to-gameflix-bg')}>
      <div className="absolute inset-0 bg-gameflix-bg/40" />
      <div className="relative p-6 md:p-10">
        <div className="flex items-start gap-4 mb-4">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', colors.bg, 'border', colors.border)}>
            <IconComponent className={cn('w-7 h-7', colors.text)} />
          </div>
          <div>
            <h1 className={cn('text-3xl font-bold', colors.text)}>{world.name}</h1>
            <p className="text-gameflix-text-dim mt-1">{world.tagline}</p>
          </div>
        </div>
        <p className="text-sm text-gameflix-text max-w-2xl mb-6">{world.description}</p>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-gameflix-text-dim">
            <Users className="w-4 h-4" />
            <span>{formatNumber(world.stats.players)} giocatori</span>
          </div>
          <div className="flex items-center gap-2 text-gameflix-text-dim">
            <Gamepad2 className="w-4 h-4" />
            <span>{world.stats.games} giochi</span>
          </div>
          <div className="flex items-center gap-2 text-gameflix-text-dim">
            <Trophy className="w-4 h-4" />
            <span>{formatNumber(world.stats.dailyPlays)} partite/giorno</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoonSection({ world }: { world: typeof WORLD_DATA[string] }) {
  const colors = getCategoryColor(world.slug);
  const IconComponent = world.icon;

  return (
    <Card padding="lg" className="text-center">
      <IconComponent className={cn('w-16 h-16 mx-auto mb-4', colors.text, 'opacity-50')} />
      <h2 className="text-xl font-bold text-gameflix-text-bright mb-2">
        {world.name} sta arrivando!
      </h2>
      <p className="text-gameflix-text-dim max-w-md mx-auto mb-4">
        Stiamo preparando contenuti incredibili per questo mondo. Resta sintonizzato per le novità.
      </p>
      <Badge variant="coming-soon">Prossimamente</Badge>
    </Card>
  );
}

function ActiveWorldContent({ world }: { world: typeof WORLD_DATA[string] }) {
  const colors = getCategoryColor(world.slug);
  const IconComponent = world.icon;
  const { data, isLoading } = useGamesByCategory(world.slug);
  const games = data ?? [];

  const dailyGame = games.length > 0 ? games[0] : null;

  return (
    <>
      {/* Daily Challenge */}
      {dailyGame && (
        <section>
          <h2 className="text-lg font-bold text-gameflix-text-bright mb-4">
            Sfida giornaliera
          </h2>
          <Card hover className="relative overflow-hidden">
            <div className={cn('absolute inset-0 bg-gradient-to-r opacity-20', colors.gradient)} />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.bg)}>
                  <IconComponent className={cn('w-6 h-6', colors.text)} />
                </div>
                <div>
                  <p className={cn('text-xs font-semibold', colors.text)}>
                    Daily {world.name}
                  </p>
                  <p className="text-lg font-bold text-gameflix-text-bright">{dailyGame.title}</p>
                  <p className="text-sm text-gameflix-text-dim">Completa la sfida giornaliera per guadagnare XP bonus</p>
                </div>
              </div>
              <Link href={`/play/${dailyGame.slug}?daily=true`}>
                <Button>
                  <Play className="w-4 h-4" />
                  Gioca
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* Games Grid */}
      <section>
        <h2 className="text-lg font-bold text-gameflix-text-bright mb-4">
          Tutti i giochi
        </h2>
        <GameList games={games} isLoading={isLoading} />
      </section>
    </>
  );
}
