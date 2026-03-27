'use client';

import { CalendarClock, Gamepad2 } from 'lucide-react';
import { cn, formatDate, getCategoryColor, getCategoryLabel } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Countdown } from '@/components/ui/countdown';
import type { CategorySlug } from '@/lib/types';

interface Release {
  id: string;
  gameTitle: string;
  gameSlug: string;
  categorySlug: CategorySlug;
  description: string;
  releaseDate: string;
  isReleased: boolean;
}

const MOCK_RELEASES: Release[] = [
  {
    id: '1',
    gameTitle: 'Word Chain',
    gameSlug: 'word-chain',
    categorySlug: 'wordforge',
    description: 'Forma catene di parole collegando lettere adiacenti. Il primo gioco del mondo WordForge!',
    releaseDate: '2026-04-02T10:00:00Z',
    isReleased: false,
  },
  {
    id: '2',
    gameTitle: 'Sequence Master',
    gameSlug: 'sequence-master',
    categorySlug: 'brainlab',
    description: 'Memorizza sequenze sempre più lunghe e sfida la tua memoria di lavoro.',
    releaseDate: '2026-03-24T10:00:00Z',
    isReleased: true,
  },
  {
    id: '3',
    gameTitle: 'Color Match',
    gameSlug: 'color-match',
    categorySlug: 'brainlab',
    description: 'Testa i tuoi riflessi con sfide cromatiche sempre più veloci.',
    releaseDate: '2026-03-20T10:00:00Z',
    isReleased: true,
  },
  {
    id: '4',
    gameTitle: 'Speed Quiz',
    gameSlug: 'speed-quiz',
    categorySlug: 'quizarena',
    description: 'Rispondi a domande di cultura generale in tempo record. Il primo gioco QuizArena!',
    releaseDate: '2026-04-10T10:00:00Z',
    isReleased: false,
  },
  {
    id: '5',
    gameTitle: 'Number Rush',
    gameSlug: 'number-rush',
    categorySlug: 'brainlab',
    description: 'Risolvi operazioni matematiche prima che scada il tempo.',
    releaseDate: '2026-03-15T10:00:00Z',
    isReleased: true,
  },
];

export default function ReleasesPage() {
  const upcomingReleases = MOCK_RELEASES.filter((r) => !r.isReleased).sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  );
  const pastReleases = MOCK_RELEASES.filter((r) => r.isReleased).sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );

  const nextRelease = upcomingReleases[0];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <CalendarClock className="w-7 h-7 text-gameflix-primary" />
        <h1 className="text-2xl font-bold text-gameflix-text-bright">Uscite</h1>
      </div>

      {/* Next Release Hero */}
      {nextRelease && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gameflix-text-bright mb-4">Prossima uscita</h2>
          <NextReleaseCard release={nextRelease} />
        </section>
      )}

      {/* Upcoming */}
      {upcomingReleases.length > 1 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gameflix-text-bright mb-4">In arrivo</h2>
          <div className="space-y-4">
            {upcomingReleases.slice(1).map((release) => (
              <ReleaseRow key={release.id} release={release} />
            ))}
          </div>
        </section>
      )}

      {/* Past Releases */}
      <section>
        <h2 className="text-lg font-bold text-gameflix-text-bright mb-4">Usciti di recente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pastReleases.map((release) => (
            <PastReleaseCard key={release.id} release={release} />
          ))}
        </div>
      </section>
    </div>
  );
}

function NextReleaseCard({ release }: { release: Release }) {
  const colors = getCategoryColor(release.categorySlug);
  return (
    <Card padding="lg" className={cn('relative overflow-hidden')}>
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-20', colors.gradient)} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="category" categorySlug={release.categorySlug} />
          <Badge variant="new">IN ARRIVO</Badge>
        </div>
        <h3 className="text-2xl font-bold text-gameflix-text-bright mb-2">{release.gameTitle}</h3>
        <p className="text-sm text-gameflix-text-dim mb-6 max-w-xl">{release.description}</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Countdown targetDate={release.releaseDate} />
          <p className="text-sm text-gameflix-text-dim">
            Disponibile il {formatDate(release.releaseDate)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ReleaseRow({ release }: { release: Release }) {
  const colors = getCategoryColor(release.categorySlug);
  return (
    <Card hover padding="sm">
      <div className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', colors.bg)}>
          <Gamepad2 className={cn('w-6 h-6', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-gameflix-text-bright">{release.gameTitle}</h3>
            <Badge variant="category" categorySlug={release.categorySlug} />
          </div>
          <p className="text-sm text-gameflix-text-dim truncate">{release.description}</p>
        </div>
        <p className="text-sm text-gameflix-text-dim whitespace-nowrap">
          {formatDate(release.releaseDate)}
        </p>
      </div>
    </Card>
  );
}

function PastReleaseCard({ release }: { release: Release }) {
  const colors = getCategoryColor(release.categorySlug);
  return (
    <Card hover padding="md">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
          <Gamepad2 className={cn('w-5 h-5', colors.text)} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gameflix-text-bright text-sm">{release.gameTitle}</h3>
            <Badge variant="category" categorySlug={release.categorySlug} />
          </div>
          <p className="text-xs text-gameflix-text-dim mb-1">{release.description}</p>
          <p className="text-[11px] text-gameflix-text-dim">{formatDate(release.releaseDate)}</p>
        </div>
      </div>
    </Card>
  );
}
