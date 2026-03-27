'use client';

import Link from 'next/link';
import {
  Gamepad2,
  Brain,
  Trophy,
  Flame,
  ArrowRight,
  Check,
  Star,
  Zap,
  Crown,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const STEPS = [
  {
    icon: Gamepad2,
    title: 'Scegli un gioco',
    description: 'Esplora decine di giochi cerebrali divisi in tre mondi unici.',
  },
  {
    icon: Brain,
    title: 'Allena la mente',
    description: 'Completa sfide giornaliere e migliora le tue abilità cognitive.',
  },
  {
    icon: Trophy,
    title: 'Scala le classifiche',
    description: 'Guadagna XP, sali di livello e sfida giocatori di tutto il mondo.',
  },
];

const FEATURED_GAMES = [
  {
    title: 'Memory Matrix',
    category: 'BrainLab',
    categorySlug: 'brainlab' as const,
    description: 'Allena la memoria visiva con griglie sempre più complesse.',
    icon: Brain,
    plays: '2.4K',
    rating: 94,
  },
  {
    title: 'Word Chain',
    category: 'WordForge',
    categorySlug: 'wordforge' as const,
    description: 'Forma catene di parole collegando lettere adiacenti.',
    icon: BookOpen,
    plays: '1.8K',
    rating: 91,
  },
  {
    title: 'Speed Quiz',
    category: 'QuizArena',
    categorySlug: 'quizarena' as const,
    description: 'Rispondi a domande di cultura generale in tempo record.',
    icon: HelpCircle,
    plays: '3.1K',
    rating: 88,
  },
];

const FREE_FEATURES = [
  '3 giochi al giorno',
  'Sfida giornaliera',
  'Classifica base',
  'Progressione XP',
];

const PREMIUM_FEATURES = [
  'Giochi illimitati',
  'Tutte le sfide giornaliere',
  'Classifiche avanzate',
  'Progressione XP accelerata',
  'Badge esclusivi',
  'Nessuna pubblicità',
  'Giochi Premium esclusivi',
  'Statistiche dettagliate',
];

export function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gameflix-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gameflix-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-gameflix-secondary/5 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-gameflix-primary/10 border border-gameflix-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-gameflix-primary" />
            <span className="text-sm text-gameflix-primary font-medium">La palestra per la mente</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gameflix-text-bright leading-tight mb-6">
            La tua palestra{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gameflix-primary to-gameflix-secondary">
              mentale
            </span>{' '}
            quotidiana
          </h1>

          <p className="text-lg md:text-xl text-gameflix-text-dim max-w-2xl mx-auto mb-8">
            Gioca ogni giorno, allena la mente, scala le classifiche. Tre mondi di giochi cerebrali
            con sfide quotidiane e un sistema di progressione che ti tiene motivato.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">
                Inizia gratis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="outline">
                Esplora i giochi
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-gameflix-text-dim">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-gameflix-primary" />
              <span className="text-sm">20+ giochi</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-gameflix-accent" />
              <span className="text-sm">Sfide giornaliere</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Classifiche globali</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gameflix-text-bright text-center mb-12">
          Come funziona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gameflix-primary/20 to-gameflix-secondary/20 border border-gameflix-primary/20 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-7 h-7 text-gameflix-primary" />
              </div>
              <div className="text-sm text-gameflix-primary font-bold mb-2">Passo {i + 1}</div>
              <h3 className="text-lg font-bold text-gameflix-text-bright mb-2">{step.title}</h3>
              <p className="text-sm text-gameflix-text-dim">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Game Showcase */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gameflix-text-bright text-center mb-4">
          Tre mondi da esplorare
        </h2>
        <p className="text-gameflix-text-dim text-center mb-12 max-w-xl mx-auto">
          Ogni mondo offre esperienze uniche per allenare diverse capacità cognitive.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_GAMES.map((game) => {
            const colorMap = {
              brainlab: { bg: 'from-brainlab/20 to-brainlab/5', text: 'text-brainlab-light', border: 'border-brainlab/20' },
              wordforge: { bg: 'from-wordforge/20 to-wordforge/5', text: 'text-wordforge-light', border: 'border-wordforge/20' },
              quizarena: { bg: 'from-quizarena/20 to-quizarena/5', text: 'text-quizarena-light', border: 'border-quizarena/20' },
            }[game.categorySlug];

            return (
              <Card key={game.title} hover className={cn('overflow-hidden')}>
                <div className={cn('h-32 bg-gradient-to-br flex items-center justify-center -mx-5 -mt-5 mb-4', colorMap.bg)}>
                  <game.icon className={cn('w-12 h-12', colorMap.text)} />
                </div>
                <span className={cn('text-xs font-bold uppercase tracking-wider', colorMap.text)}>
                  {game.category}
                </span>
                <h3 className="text-lg font-bold text-gameflix-text-bright mt-1 mb-2">
                  {game.title}
                </h3>
                <p className="text-sm text-gameflix-text-dim mb-4">{game.description}</p>
                <div className="flex items-center justify-between text-xs text-gameflix-text-dim">
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="w-3 h-3" />
                    {game.plays} giocate
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-gameflix-accent" />
                    {game.rating}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gameflix-text-bright text-center mb-4">
          Scegli il tuo piano
        </h2>
        <p className="text-gameflix-text-dim text-center mb-12 max-w-xl mx-auto">
          Inizia gratis e passa a Premium quando vuoi per sbloccare tutti i contenuti.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <Card padding="lg" className="relative">
            <h3 className="text-xl font-bold text-gameflix-text-bright mb-1">Free</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-gameflix-text-bright">0</span>
              <span className="text-gameflix-text-dim">/mese</span>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gameflix-text">
                  <Check className="w-4 h-4 text-gameflix-success shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <Button variant="outline" fullWidth>Inizia gratis</Button>
            </Link>
          </Card>

          {/* Premium Plan */}
          <Card padding="lg" className="relative border-gameflix-accent/30 shadow-lg shadow-gameflix-accent/5">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gameflix-accent text-gameflix-bg text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                CONSIGLIATO
              </span>
            </div>
            <h3 className="text-xl font-bold text-gameflix-text-bright mb-1">Premium</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-gameflix-accent">4.99</span>
              <span className="text-gameflix-text-dim">/mese</span>
            </div>
            <ul className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gameflix-text">
                  <Check className="w-4 h-4 text-gameflix-accent shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=premium">
              <Button variant="accent" fullWidth>Prova Premium</Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-br from-gameflix-primary/10 via-gameflix-card to-gameflix-secondary/10 rounded-3xl border border-gameflix-border p-12 md:p-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gameflix-text-bright mb-4">
            Pronto a iniziare?
          </h2>
          <p className="text-lg text-gameflix-text-dim mb-8 max-w-xl mx-auto">
            Unisciti a migliaia di giocatori che ogni giorno allenano la mente con Gameflix.
          </p>
          <Link href="/register">
            <Button size="lg">
              Crea il tuo account gratuito
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gameflix-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-gameflix-primary" />
            <span className="font-bold text-gameflix-text-bright">
              Game<span className="text-gameflix-primary">flix</span>
            </span>
          </div>
          <p className="text-sm text-gameflix-text-dim">
            &copy; 2026 Gameflix. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
}
