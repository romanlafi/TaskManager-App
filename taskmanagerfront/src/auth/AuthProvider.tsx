import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
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

export function AuthProvider({ children }: { readonly children: ReactNode }) {
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
    void refreshAccessToken().catch((error_) => {
      if (active && !(error_ instanceof SessionExpiredError) && !isCancelled(error_)) setError(true);
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [snapshot, attempt]);

  useEffect(() => {
    const onFocus = () => { if (!isCurrentToken(getAccessToken()) && !isLoggedOut()) retry(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const authenticated = !!getAccessToken() && !isLoggedOut();
  const sessionId = getSessionState();
  const value = useMemo(() => ({ authenticated, checking, error, sessionId, retry }), [authenticated, checking, error, sessionId, retry]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider is required');
  return auth;
}
