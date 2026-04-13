import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/services';
import type { Role } from '../types';

export function RequireAuth() {
  const { isAuthenticated, user, setUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated() && !user) {
      authApi.me().then(r => setUser(r.data)).catch(() => {});
    }
  }, [isAuthenticated, user, setUser]);

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuthStore();
  if (!user) return null;
  if (!roles.includes(user.role)) return <Navigate to="/conversations" replace />;
  return <Outlet />;
}