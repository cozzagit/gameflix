'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { AuthenticatedHome } from '@/components/home/authenticated-home';
import { LandingPage } from '@/components/home/landing-page';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gameflix-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHome />;
  }

  return <LandingPage />;
}
