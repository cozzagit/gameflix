'use client';

import Link from 'next/link';
import { Check, X, Crown, Gamepad2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const COMPARISON = [
  { feature: 'Giochi disponibili', free: '5 giochi', premium: 'Tutti i giochi' },
  { feature: 'Partite giornaliere', free: '3 al giorno', premium: 'Illimitate' },
  { feature: 'Sfide giornaliere', free: '1 mondo', premium: 'Tutti i mondi' },
  { feature: 'Classifiche', free: 'Globale', premium: 'Globale + Per gioco' },
  { feature: 'Progressione XP', free: '1x', premium: '2x accelerata' },
  { feature: 'Badge esclusivi', free: false, premium: true },
  { feature: 'Statistiche dettagliate', free: false, premium: true },
  { feature: 'Giochi Premium', free: false, premium: true },
  { feature: 'Pubblicità', free: 'Presenti', premium: 'Nessuna' },
  { feature: 'Accesso anticipato', free: false, premium: true },
  { feature: 'Supporto prioritario', free: false, premium: true },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gameflix-bg">
      {/* Header */}
      <div className="border-b border-gameflix-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gameflix-primary to-gameflix-secondary flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gameflix-text-bright">
              Game<span className="text-gameflix-primary">flix</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-gameflix-text-dim hover:text-gameflix-text flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Torna alla home
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gameflix-text-bright mb-4">
            Scegli il piano perfetto per te
          </h1>
          <p className="text-lg text-gameflix-text-dim max-w-xl mx-auto">
            Inizia gratuitamente e passa a Premium quando vuoi per sbloccare
            l&apos;esperienza completa.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
          {/* Free */}
          <Card padding="lg">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gameflix-text-bright mb-2">Free</h2>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gameflix-text-bright">0</span>
                <span className="text-xl text-gameflix-text-dim">/mese</span>
              </div>
              <p className="text-sm text-gameflix-text-dim mt-2">Per sempre gratis</p>
            </div>
            <Link href="/register">
              <Button variant="outline" fullWidth size="lg">
                Inizia gratis
              </Button>
            </Link>
          </Card>

          {/* Premium */}
          <Card
            padding="lg"
            className="relative border-gameflix-accent/30 shadow-lg shadow-gameflix-accent/10"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gameflix-accent text-gameflix-bg text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                CONSIGLIATO
              </span>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gameflix-text-bright mb-2">Premium</h2>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gameflix-accent">4.99</span>
                <span className="text-xl text-gameflix-text-dim">/mese</span>
              </div>
              <p className="text-sm text-gameflix-text-dim mt-2">
                oppure 39.99/anno (risparmi il 33%)
              </p>
            </div>
            <Link href="/register?plan=premium">
              <Button variant="accent" fullWidth size="lg">
                <Crown className="w-4 h-4" />
                Inizia con Premium
              </Button>
            </Link>
          </Card>
        </div>

        {/* Comparison Table */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gameflix-text-bright text-center mb-8">
            Confronto dettagliato
          </h2>
          <Card padding="none" className="overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gameflix-surface border-b border-gameflix-border">
              <div className="text-sm font-semibold text-gameflix-text-dim">Funzionalità</div>
              <div className="text-sm font-semibold text-gameflix-text-dim text-center">Free</div>
              <div className="text-sm font-semibold text-gameflix-accent text-center">Premium</div>
            </div>
            {/* Rows */}
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={cn(
                  'grid grid-cols-3 gap-4 px-6 py-3.5 border-b border-gameflix-border last:border-0',
                  i % 2 === 0 ? 'bg-gameflix-card' : 'bg-gameflix-surface/50'
                )}
              >
                <div className="text-sm text-gameflix-text">{row.feature}</div>
                <div className="text-center">
                  <FeatureValue value={row.free} />
                </div>
                <div className="text-center">
                  <FeatureValue value={row.premium} isPremium />
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="text-xl font-bold text-gameflix-text-bright text-center mb-8">
            Domande frequenti
          </h2>
          <div className="space-y-4">
            <FaqItem
              question="Posso cancellare l'abbonamento in qualsiasi momento?"
              answer="Sì, puoi cancellare il tuo abbonamento Premium in qualsiasi momento dalle impostazioni del tuo account. Continuerai ad avere accesso alle funzionalità Premium fino alla fine del periodo pagato."
            />
            <FaqItem
              question="Cosa succede ai miei progressi se passo da Premium a Free?"
              answer="I tuoi progressi, XP, badge e statistiche vengono mantenuti. Tuttavia, perderai l'accesso ai giochi Premium e alle funzionalità esclusive."
            />
            <FaqItem
              question="C'è un periodo di prova per Premium?"
              answer="Attualmente non offriamo un periodo di prova gratuito, ma puoi iniziare con il piano Free per provare la piattaforma prima di decidere di passare a Premium."
            />
            <FaqItem
              question="Quali metodi di pagamento accettate?"
              answer="Accettiamo carte di credito e debito (Visa, Mastercard, American Express) e PayPal."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureValue({ value, isPremium }: { value: string | boolean; isPremium?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className={cn('w-5 h-5 mx-auto', isPremium ? 'text-gameflix-accent' : 'text-gameflix-success')} />
    ) : (
      <X className="w-5 h-5 mx-auto text-gameflix-text-dim/50" />
    );
  }
  return (
    <span className={cn('text-sm', isPremium ? 'text-gameflix-accent font-medium' : 'text-gameflix-text-dim')}>
      {value}
    </span>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <Card padding="md">
      <h3 className="font-semibold text-gameflix-text-bright mb-2">{question}</h3>
      <p className="text-sm text-gameflix-text-dim leading-relaxed">{answer}</p>
    </Card>
  );
}
