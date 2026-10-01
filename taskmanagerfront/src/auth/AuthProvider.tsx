import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { getAccessToken, getSessionSnapshot, getSessionState, isCurrentToken, isLoggedOut, refreshAccessToken, SessionExpiredError, subscribeSession } from '../services/session';
import { isCancelled } from '../services/http';

interface AuthState {
  authenticated: boolean;
  checking: boolean;
  error: boolean;
  sessionId: string | null;
  retry: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeSession, getSessionSnapshot);
  const [checking, setChecking] = useState(!isCurrentToken(getAccessToken()) && !isLoggedOut());
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt((previous) => previous + 1);

  useEffect(() => {
    let active = true;
    setError(false);
    if (isLoggedOut() || isCurrentToken(getAccessToken())) {
      setChecking(false);
      return;
    }
    setChecking(true);
    void refreshAccessToken().catch((failure) => {
      if (active && !(failure instanceof SessionExpiredError) && !isCancelled(failure)) setError(true);
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [snapshot, attempt]);

  useEffect(() => {
    const onFocus = () => { if (!isCurrentToken(getAccessToken()) && !isLoggedOut()) retry(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return <AuthContext.Provider value={{ authenticated: !!getAccessToken() && !isLoggedOut(), checking, error, sessionId: getSessionState(), retry }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider is required');
  return auth;
}
