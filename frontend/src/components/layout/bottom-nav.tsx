'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Zap, Trophy, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Esplora', icon: Compass },
  { href: '/daily', label: 'Daily', icon: Zap, hasDot: true },
  { href: '/leaderboard', label: 'Classifica', icon: Trophy },
  { href: '/profile', label: 'Profilo', icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gameflix-bg/90 backdrop-blur-xl border-t border-gameflix-border safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isProfileLink = item.href === '/profile';
          const resolvedHref =
            isProfileLink && isAuthenticated && user
              ? `/profile/${user.username}`
              : isProfileLink && !isAuthenticated
                ? '/login'
                : item.href;

          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.href === '/profile'
                ? pathname.startsWith('/profile')
                : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={resolvedHref}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors',
                isActive
                  ? 'text-gameflix-primary'
                  : 'text-gameflix-text-dim'
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.hasDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gameflix-success border border-gameflix-bg" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
