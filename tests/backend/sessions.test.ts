import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hashSync } from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import app from '../../cloudflare/src/index';
import type { Env } from '../../cloudflare/src/types';
import { createTestDatabase } from './helpers/database';

let database: ReturnType<typeof createTestDatabase>;
let env: Env;

beforeEach(() => {
  database = createTestDatabase();
  env = { DB: database.database, JWT_SECRET: 'session-test-secret' } as Env;
  database.sqlite.prepare('INSERT INTO users (username, hashed_password) VALUES (?, ?)').run('alice', hashSync('password', 4));
});
afterEach(() => database.sqlite.close());

async function login(cookie?: string, origin = 'https://app.example') {
  const response = await app.request('https://app.example/api/users/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ username: 'alice', password: 'password' }),
  }, env);
  return { response, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '', data: await response.json() };
}

function sessionRequest(action: string, cookie = '', extraHeaders: Record<string, string> = {}) {
  return app.request(`https://app.example/api/users/${action}`, {
    method: 'POST', headers: { Cookie: cookie, Origin: 'https://app.example', ...extraHeaders },
  }, env);
}

function tasks(token: string) {
  return app.request('/api/tasks/', { headers: { Authorization: `Bearer ${token}` } }, env);
}

describe('persistent sessions', () => {
  it('stores only a hash and issues a scoped HttpOnly cookie and session JWT', async () => {
    const { response, cookie, data } = await login();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('Secure');
    expect(response.headers.get('set-cookie')).toContain('SameSite=Strict');
    expect(response.headers.get('set-cookie')).toContain('Path=/api/users');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=2592000');
    const row = database.sqlite.prepare('SELECT * FROM sessions').get()!;
    expect(cookie).not.toContain(String(row.token_hash));
    expect(String(row.token_hash)).toHaveLength(64);
    const { payload } = await jwtVerify(data.access_token, new TextEncoder().encode(env.JWT_SECRET));
    expect(payload.sid).toBe(row.id);
    expect(data.expires_in).toBe(1800);
    expect((await tasks(data.access_token)).status).toBe(200);
  });

  it('renews after access token expiry without extending the session lifetime', async () => {
    const { cookie, data } = await login();
    const expiresAt = database.sqlite.prepare('SELECT expires_at FROM sessions').get()!.expires_at;
    vi.useFakeTimers();
    try {
      vi.setSystemTime(Date.now() + 31 * 60 * 1000);
      expect((await tasks(data.access_token)).status).toBe(401);
      const response = await sessionRequest('refresh', cookie);
      expect(response.status).toBe(200);
      expect(response.headers.get('set-cookie')).toBeNull();
      expect((await tasks((await response.json()).access_token)).status).toBe(200);
      expect(database.sqlite.prepare('SELECT expires_at FROM sessions').get()!.expires_at).toBe(expiresAt);
    } finally { vi.useRealTimers(); }
  });

  it('allows simultaneous renewals from different tabs', async () => {
    const { cookie } = await login();
    const responses = await Promise.all([sessionRequest('refresh', cookie), sessionRequest('refresh', cookie)]);
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect((await tasks((await response.json()).access_token)).status).toBe(200);
    }
  });

  it('revokes both refresh and access tokens on logout', async () => {
    const { cookie, data } = await login();
    const response = await sessionRequest('logout', cookie);
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect((await sessionRequest('refresh', cookie)).status).toBe(401);
    expect((await tasks(data.access_token)).status).toBe(401);
    expect((await sessionRequest('logout')).status).toBe(204);
  });

  it.each(['missing', 'invalid', 'expired', 'inactive', 'deleted'])('rejects a %s session', async (mode) => {
    const { cookie, data } = await login();
    if (mode === 'expired') database.sqlite.exec('UPDATE sessions SET expires_at = 0');
    if (mode === 'inactive') database.sqlite.exec('UPDATE users SET is_active = 0');
    if (mode === 'deleted') database.sqlite.exec('DELETE FROM users');
    const response = await sessionRequest('refresh', mode === 'missing' ? '' : mode === 'invalid' ? 'taskmanager_refresh=invalid' : cookie);
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    if (mode !== 'missing' && mode !== 'invalid') expect((await tasks(data.access_token)).status).toBe(401);
  });

  it('replaces the existing browser session on a new login and cleans expired sessions', async () => {
    const previous = await login();
    database.sqlite.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run('expired', 'expired-hash', 1, 0);
    const next = await login(previous.cookie);
    expect(next.cookie).not.toBe(previous.cookie);
    expect(database.sqlite.prepare('SELECT COUNT(*) AS count FROM sessions').get()!.count).toBe(1);
    expect((await tasks(previous.data.access_token)).status).toBe(401);
  });

  it.each(['refresh', 'logout', 'token'])('rejects cross-origin %s without changing the session', async (action) => {
    const { cookie } = await login();
    expect((await sessionRequest(action, cookie, { Origin: 'https://evil.example' })).status).toBe(403);
    expect((await sessionRequest('refresh', cookie)).status).toBe(200);
  });

  it('rejects cross-site requests without Origin and supports a configured frontend origin', async () => {
    expect((await app.request('/api/users/refresh', { method: 'POST', headers: { 'Sec-Fetch-Site': 'cross-site' } }, env)).status).toBe(403);
    env.FRONTEND_ORIGIN = 'https://frontend.example';
    const { response } = await login(undefined, env.FRONTEND_ORIGIN);
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(env.FRONTEND_ORIGIN);
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
  });

  it('returns JSON 404 for unknown API routes even with an asset binding', async () => {
    env.ASSETS = { fetch: vi.fn().mockResolvedValue(new Response('<html>')) } as unknown as Env['ASSETS'];
    const response = await app.request('/api/missing', {}, env);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ detail: 'Not found' });
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
    expect((await app.request('/api', {}, env)).status).toBe(404);
  });

  it('reports database failures as server errors without clearing the cookie', async () => {
    const { cookie, data } = await login();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(env.DB, 'prepare').mockImplementation(() => { throw new Error('Database unavailable'); });
    expect((await tasks(data.access_token)).status).toBe(500);
    const response = await sessionRequest('refresh', cookie);
    expect(response.status).toBe(500);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it.each([42, 'missing-session'])('rejects invalid session claims %s', async (sid) => {
    const token = await new SignJWT({ sub: 'alice', userId: 1, sid }).setProtectedHeader({ alg: 'HS256' })
      .setIssuer('taskmanager-app').setIssuedAt().setExpirationTime('30m').sign(new TextEncoder().encode(env.JWT_SECRET));
    expect((await tasks(token)).status).toBe(401);
  });
});
