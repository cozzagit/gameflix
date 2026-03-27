'use client';

import { useState, Suspense, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gamepad2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gameflix-bg" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
        const msg = axiosErr.response?.data?.message;
        setError(typeof msg === 'string' ? msg : 'Email o password non validi. Riprova.');
      } else {
        setError('Email o password non validi. Riprova.');
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gameflix-bg px-4">
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
            Bentornato!
          </h1>
          <p className="text-sm text-gameflix-text-dim text-center mb-6">
            Accedi per continuare il tuo allenamento mentale
          </p>

          {error && (
            <div className="bg-gameflix-danger/10 border border-gameflix-danger/30 text-gameflix-danger text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="la-tua@email.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="La tua password"
                icon={<Lock className="w-4 h-4" />}
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

            <div className="flex justify-end">
              <Link href="#" className="text-sm text-gameflix-primary hover:underline">
                Password dimenticata?
              </Link>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Accedi
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gameflix-text-dim mt-6">
          Non hai un account?{' '}
          <Link href="/register" className="text-gameflix-primary hover:underline font-medium">
            Registrati gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
