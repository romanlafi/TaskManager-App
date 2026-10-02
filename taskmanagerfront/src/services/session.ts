import { API_ENDPOINTS } from '../config/api';

const sessionEvent = 'taskmanager:session';
const stateKey = 'auth_state';
let refreshing: { state: string | null; promise: Promise<string> } | undefined;

export class SessionExpiredError extends Error {
  constructor() { super('Session expired'); }
}

export function getSessionState() { return localStorage.getItem(stateKey); }
export function getAccessToken() { return localStorage.getItem('access_token'); }
export function isLoggedOut() { return getSessionState()?.startsWith('out:') ?? false; }

export function isCurrentToken(token: unknown): token is string {
  if (typeof token !== 'string' || !token) return false;
  try {
    const payload: unknown = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload !== null && typeof payload === 'object' && 'exp' in payload &&
      typeof payload.exp === 'number' && payload.exp > Date.now() / 1000 + 30;
  } catch { return false; }
}

function notify(reason?: string) {
  window.dispatchEvent(new CustomEvent(sessionEvent, { detail: reason }));
}

export function subscribeSession(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === stateKey || event.key === 'access_token') listener();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(sessionEvent, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(sessionEvent, listener);
  };
}

export function subscribeExpiration(listener: () => void) {
  const onSession = (event: Event) => {
    if ((event as CustomEvent).detail === 'expired') listener();
  };
  window.addEventListener(sessionEvent, onSession);
  return () => window.removeEventListener(sessionEvent, onSession);
}

export function getSessionSnapshot() {
  return JSON.stringify([getSessionState(), getAccessToken()]);
}

export function saveLogin(token: string) {
  if (!isCurrentToken(token)) throw new Error('Invalid login response');
  localStorage.setItem('access_token', token);
  localStorage.setItem(stateKey, `in:${crypto.randomUUID()}`);
  notify();
}

export function clearSession(expired = false) {
  localStorage.setItem(stateKey, `out:${crypto.randomUUID()}`);
  localStorage.removeItem('access_token');
  notify(expired ? 'expired' : undefined);
}

export function assertSession(state: string | null) {
  if (getSessionState() !== state) throw new DOMException('Session changed', 'AbortError');
}

export function refreshAccessToken(): Promise<string> {
  const state = getSessionState();
  if (isLoggedOut()) return Promise.reject(new SessionExpiredError());
  if (refreshing?.state === state) return refreshing.promise;
  const promise = (async () => {
    const response = await fetch(API_ENDPOINTS.REFRESH, { method: 'POST', credentials: 'include' });
    assertSession(state);
    if (response.status === 401) {
      clearSession(!!getAccessToken() || !!state?.startsWith('in:'));
      throw new SessionExpiredError();
    }
    if (response.status !== 200) throw new Error('Could not restore session');
    const body: unknown = await response.json();
    assertSession(state);
    const token = body && typeof body === 'object' && 'access_token' in body ? body.access_token : undefined;
    if (!isCurrentToken(token)) throw new Error('Invalid refresh response');
    localStorage.setItem('access_token', token);
    if (!state) localStorage.setItem(stateKey, `in:${crypto.randomUUID()}`);
    notify();
    return token;
  })();
  refreshing = { state, promise };
  const finishRefresh = () => {
    if (refreshing?.promise === promise) refreshing = undefined;
  };
  void promise.then(finishRefresh, finishRefresh);
  return promise;
}

export async function logoutSession() {
  clearSession();
  const state = getSessionState();
  const response = await fetch(API_ENDPOINTS.LOGOUT, { method: 'POST', credentials: 'include' });
  assertSession(state);
  if (response.status !== 204) throw new Error('Could not revoke session');
}
