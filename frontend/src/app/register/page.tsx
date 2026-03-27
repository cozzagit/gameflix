'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gamepad2, Mail, Lock, User, Eye, EyeOff, AtSign } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (displayName.length < 2) errors.displayName = 'Il nome deve avere almeno 2 caratteri';
    if (username.length < 3) errors.username = 'Lo username deve avere almeno 3 caratteri';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.username = 'Solo lettere, numeri e underscore';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email non valida';
    if (password.length < 8) errors.password = 'La password deve avere almeno 8 caratteri';
    if (password !== confirmPassword) errors.confirmPassword = 'Le password non coincidono';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    try {
      await register(email, password, displayName || username);
      router.push('/');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string | string[]; statusCode?: number } } };
        const msg = axiosErr.response?.data?.message;
        if (Array.isArray(msg)) {
          setError(msg.join('. '));
        } else if (msg === 'Email already registered') {
          setFieldErrors({ email: 'Questa email è già registrata' });
          setError('Questa email è già registrata. Prova ad accedere.');
        } else {
          setError(msg || 'Registrazione fallita. Riprova.');
        }
      } else {
        setError('Registrazione fallita. Riprova.');
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gameflix-bg px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gameflix-primary to-gameflix-secondary flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gameflix-text-bright">
            Game<span className="text-gameflix-primary">flix</span>
          </span>
        </Link>

        <Card padding="lg">
          <h1 className="text-2xl font-bold text-gameflix-text-bright text-center mb-2">
            Crea il tuo account
          </h1>
          <p className="text-sm text-gameflix-text-dim text-center mb-6">
            Inizia il tuo viaggio nella palestra mentale
          </p>

          {error && (
            <div className="bg-gameflix-danger/10 border border-gameflix-danger/30 text-gameflix-danger text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Il tuo nome"
              icon={<User className="w-4 h-4" />}
              error={fieldErrors.displayName}
              required
            />

            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="il_tuo_username"
              icon={<AtSign className="w-4 h-4" />}
              error={fieldErrors.username}
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="la-tua@email.com"
              icon={<Mail className="w-4 h-4" />}
              error={fieldErrors.email}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 8 caratteri"
                icon={<Lock className="w-4 h-4" />}
                error={fieldErrors.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gameflix-text-dim hover:text-gameflix-text cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Conferma password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ripeti la password"
              icon={<Lock className="w-4 h-4" />}
              error={fieldErrors.confirmPassword}
              required
            />

            <p className="text-xs text-gameflix-text-dim">
              Creando un account accetti i{' '}
              <Link href="#" className="text-gameflix-primary hover:underline">
                Termini di servizio
              </Link>{' '}
              e la{' '}
              <Link href="#" className="text-gameflix-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Crea account
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gameflix-text-dim mt-6">
          Hai già un account?{' '}
          <Link href="/login" className="text-gameflix-primary hover:underline font-medium">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
