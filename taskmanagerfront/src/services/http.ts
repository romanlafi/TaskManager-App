import { assertSession, clearSession, getAccessToken, getSessionState, isLoggedOut, refreshAccessToken, SessionExpiredError } from './session';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function isCancelled(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function authenticatedRequest<Result>(url: string, options: RequestInit = {}): Promise<Result> {
  const state = getSessionState();
  if (isLoggedOut()) throw new SessionExpiredError();
  const send = (token: string | null) => fetch(url, {
    ...options,
    headers: { ...Object.fromEntries(new Headers(options.headers)), Authorization: `Bearer ${token}` },
  });
  const token = getAccessToken();
  let response = await send(token);
  assertSession(state);
  if (response.status === 401) {
    const currentToken = getAccessToken();
    const renewedToken = currentToken && currentToken !== token ? currentToken : await refreshAccessToken();
    assertSession(state);
    options.signal?.throwIfAborted();
    response = await send(renewedToken);
    assertSession(state);
    if (response.status === 401) {
      clearSession(true);
      throw new SessionExpiredError();
    }
  }
  options.signal?.throwIfAborted();
  if (response.status < 200 || response.status >= 300) {
    const body: unknown = await response.json().catch(() => null);
    assertSession(state);
    const detail = body && typeof body === 'object' && 'detail' in body ? body.detail : undefined;
    throw new HttpError(response.status, typeof detail === 'string' ? detail : 'Request failed');
  }
  const result: Result = await response.json();
  assertSession(state);
  options.signal?.throwIfAborted();
  return result;
}
