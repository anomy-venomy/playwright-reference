import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService, type LoginInput, type SignupInput } from '../services/authService';
import { setUnauthorizedListener } from '../services/api';
import type { User } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  /** Set when the session ended unexpectedly (e.g. cookie expired) so the login page can explain why. */
  sessionExpired: boolean;
  isAdmin: boolean;
  login: (input: LoginInput) => Promise<User>;
  signup: (input: SignupInput) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [sessionExpired, setSessionExpired] = useState(false);

  // Ask the server who we are. The session lives in an httpOnly cookie, so JS can't read it directly.
  useEffect(() => {
    authService
      .me()
      .then((u) => {
        setUserState(u);
        setStatus('authenticated');
      })
      .catch(() => setStatus('unauthenticated'));
  }, []);

  useEffect(() => {
    setUnauthorizedListener(() => {
      setUserState(null);
      setStatus('unauthenticated');
      setSessionExpired(true);
    });
    return () => setUnauthorizedListener(null);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const u = await authService.login(input);
    setUserState(u);
    setStatus('authenticated');
    setSessionExpired(false);
    return u;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const u = await authService.signup(input);
    setUserState(u);
    setStatus('authenticated');
    setSessionExpired(false);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUserState(null);
      setStatus('unauthenticated');
      setSessionExpired(false);
    }
  }, []);

  const setUser = useCallback((u: User) => setUserState(u), []);

  const value = useMemo(
    () => ({ user, status, sessionExpired, isAdmin: user?.role === 'ADMIN', login, signup, logout, setUser }),
    [user, status, sessionExpired, login, signup, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
