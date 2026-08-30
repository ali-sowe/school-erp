import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Wraps the app once and owns the "who am I" question. The token itself
// lives in an httpOnly cookie (server sets it on login), so this context
// only ever holds the user object and derived permissions in memory —
// nothing sensitive touches localStorage.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data?.data || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data?.data?.user || null);
    return response.data?.data?.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  // Accepts either a single permission string or an array — every
  // permission listed must be present, matching the backend's authorize()
  // middleware so the UI never offers an action the API would reject.
  const hasPermission = useCallback(
    (required) => {
      if (!required) return true;
      const requiredList = Array.isArray(required) ? required : [required];
      const userPermissions = user?.permissions || [];
      return requiredList.every((permission) => userPermissions.includes(permission));
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, loading, login, logout, hasPermission, refresh: loadCurrentUser }),
    [user, loading, login, logout, hasPermission, loadCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
