'use client';

import { useAuthStore } from '@/lib/stores/auth-store';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isPremium = useAuthStore((s) => s.isPremium);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isPremium,
    login,
    register,
    logout,
    updateUser,
  };
}
