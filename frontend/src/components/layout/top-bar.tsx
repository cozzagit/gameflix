'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Crown,
  Gamepad2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StreakCounter } from '@/components/gamification/streak-counter';
import { XpBar } from '@/components/gamification/xp-bar';

export function TopBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  }

  function handleLogout() {
    logout();
    setShowDropdown(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-40 bg-gameflix-bg/80 backdrop-blur-xl border-b border-gameflix-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gameflix-primary to-gameflix-secondary flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gameflix-text-bright hidden sm:block">
            Game<span className="text-gameflix-primary">flix</span>
          </span>
        </Link>

        {/* Search bar - desktop */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gameflix-text-dim" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca giochi..."
                className="w-full bg-gameflix-surface border border-gameflix-border rounded-xl pl-10 pr-4 py-2 text-sm text-gameflix-text placeholder:text-gameflix-text-dim focus:outline-none focus:ring-2 focus:ring-gameflix-primary/50 focus:border-gameflix-primary transition-all"
              />
            </div>
          </form>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              setTimeout(() => searchRef.current?.focus(), 100);
            }}
            className="md:hidden p-2 rounded-lg text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-surface transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          {isAuthenticated && user ? (
            <>
              {/* Streak */}
              <StreakCounter streak={user.streakDays} size="sm" />

              {/* XP bar */}
              <div className="hidden lg:block">
                <XpBar totalXp={user.totalXp} currentLevel={user.currentLevel} size="sm" />
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-surface transition-colors cursor-pointer">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gameflix-danger" />
              </button>

              {/* User menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gameflix-surface transition-colors cursor-pointer"
                >
                  <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-gameflix-text-dim transition-transform hidden sm:block',
                      showDropdown && 'rotate-180'
                    )}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-gameflix-card border border-gameflix-border rounded-xl shadow-xl shadow-black/20 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gameflix-border">
                      <p className="text-sm font-semibold text-gameflix-text-bright">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gameflix-text-dim">@{user.username}</p>
                      {user.plan === 'premium' && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-gameflix-accent">
                          <Crown className="w-3 h-3" />
                          Premium
                        </span>
                      )}
                    </div>
                    <div className="py-1">
                      <DropdownLink
                        href={`/profile/${user.username}`}
                        icon={<User className="w-4 h-4" />}
                        label="Profilo"
                        onClick={() => setShowDropdown(false)}
                      />
                      <DropdownLink
                        href="/settings"
                        icon={<Settings className="w-4 h-4" />}
                        label="Impostazioni"
                        onClick={() => setShowDropdown(false)}
                      />
                      {user.plan !== 'premium' && (
                        <DropdownLink
                          href="/pricing"
                          icon={<Crown className="w-4 h-4" />}
                          label="Passa a Premium"
                          onClick={() => setShowDropdown(false)}
                          highlight
                        />
                      )}
                    </div>
                    <div className="border-t border-gameflix-border pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gameflix-danger hover:bg-gameflix-surface transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Esci
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Accedi
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Registrati</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <div className="md:hidden px-4 pb-3 animate-fade-in">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gameflix-text-dim" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca giochi..."
                className="w-full bg-gameflix-surface border border-gameflix-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gameflix-text placeholder:text-gameflix-text-dim focus:outline-none focus:ring-2 focus:ring-gameflix-primary/50"
              />
            </div>
          </form>
        </div>
      )}
    </header>
  );
}

function DropdownLink({
  href,
  icon,
  label,
  onClick,
  highlight,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
        highlight
          ? 'text-gameflix-accent hover:bg-gameflix-accent/10'
          : 'text-gameflix-text hover:bg-gameflix-surface'
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
