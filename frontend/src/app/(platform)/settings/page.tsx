'use client';

import { useState } from 'react';
import { User, Mail, Lock, CreditCard, Bell, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { user, isPremium } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklyDigest: true,
    achievements: true,
    leaderboard: false,
    marketing: false,
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showStreak: true,
    showLevel: true,
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-gameflix-text-bright">Impostazioni</h1>

      {/* Profile */}
      <Card padding="lg">
        <CardTitle className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-gameflix-primary" />
          Profilo
        </CardTitle>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatarUrl || null} alt={user?.displayName || ''} size="lg" />
            <div>
              <Button variant="outline" size="sm">Cambia avatar</Button>
              <p className="text-xs text-gameflix-text-dim mt-1">JPG, PNG. Max 2MB.</p>
            </div>
          </div>
          <Input
            label="Nome visualizzato"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Il tuo nome"
          />
          <Input
            label="Username"
            value={user?.username || ''}
            disabled
            className="opacity-60"
          />
          <Button>Salva modifiche</Button>
        </div>
      </Card>

      {/* Account */}
      <Card padding="lg">
        <CardTitle className="flex items-center gap-2 mb-6">
          <Mail className="w-5 h-5 text-gameflix-primary" />
          Account
        </CardTitle>
        <div className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
          />
          <div>
            <label className="block text-sm font-medium text-gameflix-text mb-1.5">Password</label>
            <Button variant="outline" size="sm">
              <Lock className="w-4 h-4" />
              Cambia password
            </Button>
          </div>
          <Button>Aggiorna email</Button>
        </div>
      </Card>

      {/* Subscription */}
      <Card padding="lg">
        <CardTitle className="flex items-center gap-2 mb-6">
          <CreditCard className="w-5 h-5 text-gameflix-primary" />
          Abbonamento
        </CardTitle>
        <div className="flex items-center justify-between p-4 bg-gameflix-surface rounded-xl mb-4">
          <div className="flex items-center gap-3">
            {isPremium ? (
              <Crown className="w-6 h-6 text-gameflix-accent" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gameflix-border" />
            )}
            <div>
              <p className="font-semibold text-gameflix-text-bright">
                Piano {isPremium ? 'Premium' : 'Free'}
              </p>
              <p className="text-xs text-gameflix-text-dim">
                {isPremium ? 'Rinnovo il 15 Aprile 2026' : 'Accesso limitato'}
              </p>
            </div>
          </div>
          {isPremium ? (
            <Badge variant="premium">ATTIVO</Badge>
          ) : (
            <Badge>FREE</Badge>
          )}
        </div>
        {isPremium ? (
          <div className="flex gap-3">
            <Button variant="outline">Gestisci abbonamento</Button>
            <Button variant="ghost" className="text-gameflix-danger">Cancella</Button>
          </div>
        ) : (
          <Button variant="accent">
            <Crown className="w-4 h-4" />
            Passa a Premium
          </Button>
        )}
      </Card>

      {/* Notifications */}
      <Card padding="lg">
        <CardTitle className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-gameflix-primary" />
          Notifiche
        </CardTitle>
        <div className="space-y-4">
          <Toggle
            label="Promemoria giornaliero"
            description="Ricevi un promemoria per completare la sfida giornaliera"
            checked={notifications.dailyReminder}
            onChange={(v) => setNotifications({ ...notifications, dailyReminder: v })}
          />
          <Toggle
            label="Riassunto settimanale"
            description="Ricevi un riepilogo dei tuoi progressi ogni settimana"
            checked={notifications.weeklyDigest}
            onChange={(v) => setNotifications({ ...notifications, weeklyDigest: v })}
          />
          <Toggle
            label="Traguardi e badge"
            description="Notifica quando ottieni un nuovo badge o sali di livello"
            checked={notifications.achievements}
            onChange={(v) => setNotifications({ ...notifications, achievements: v })}
          />
          <Toggle
            label="Aggiornamenti classifica"
            description="Notifica quando qualcuno supera il tuo punteggio"
            checked={notifications.leaderboard}
            onChange={(v) => setNotifications({ ...notifications, leaderboard: v })}
          />
          <Toggle
            label="Novità e promozioni"
            description="Ricevi informazioni su nuovi giochi e offerte"
            checked={notifications.marketing}
            onChange={(v) => setNotifications({ ...notifications, marketing: v })}
          />
        </div>
      </Card>

      {/* Privacy */}
      <Card padding="lg">
        <CardTitle className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-gameflix-primary" />
          Privacy
        </CardTitle>
        <div className="space-y-4">
          <Toggle
            label="Profilo pubblico"
            description="Permetti ad altri giocatori di vedere il tuo profilo"
            checked={privacy.publicProfile}
            onChange={(v) => setPrivacy({ ...privacy, publicProfile: v })}
          />
          <Toggle
            label="Mostra streak"
            description="Mostra la tua streak nel profilo pubblico"
            checked={privacy.showStreak}
            onChange={(v) => setPrivacy({ ...privacy, showStreak: v })}
          />
          <Toggle
            label="Mostra livello"
            description="Mostra il tuo livello nel profilo pubblico"
            checked={privacy.showLevel}
            onChange={(v) => setPrivacy({ ...privacy, showLevel: v })}
          />
        </div>
      </Card>

      {/* Danger Zone */}
      <Card padding="lg" className="border-gameflix-danger/20">
        <CardTitle className="text-gameflix-danger mb-4">Zona pericolosa</CardTitle>
        <p className="text-sm text-gameflix-text-dim mb-4">
          Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati permanentemente.
        </p>
        <Button variant="danger" size="sm">Elimina account</Button>
      </Card>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gameflix-text">{label}</p>
        <p className="text-xs text-gameflix-text-dim">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer',
          checked ? 'bg-gameflix-primary' : 'bg-gameflix-border'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}
