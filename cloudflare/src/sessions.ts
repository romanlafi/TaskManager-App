import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { createAccessToken } from './auth';
import type { AuthUser, Env } from './types';

type SessionContext = Context<{ Bindings: Env }>;
const cookieName = 'taskmanager_refresh';
const sessionLifetime = 30 * 24 * 60 * 60;
const cookiePath = '/api/users';

export function trustedOrigin(c: SessionContext) {
  const origin = c.req.header('Origin');
  if (!origin) return c.req.header('Sec-Fetch-Site') !== 'cross-site';
  return origin === new URL(c.req.url).origin || origin === c.env.FRONTEND_ORIGIN;
}

export async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function revokeSession(c: SessionContext, clearCookie = true) {
  const token = getCookie(c, cookieName);
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await tokenHash(token)).run();
  }
  if (clearCookie) deleteCookie(c, cookieName, { path: cookiePath, secure: new URL(c.req.url).protocol === 'https:' });
}

export async function startSession(c: SessionContext, user: AuthUser) {
  const sessionId = crypto.randomUUID();
  const token = `${sessionId}.${crypto.randomUUID()}.${crypto.randomUUID()}`;
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetime;
  await revokeSession(c, false);
  await c.env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(Math.floor(Date.now() / 1000)).run();
  await c.env.DB.prepare('INSERT INTO sessions (id, token_hash, user_id, expires_at) VALUES (?, ?, ?, ?)')
    .bind(sessionId, await tokenHash(token), user.id, expiresAt).run();
  setCookie(c, cookieName, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Strict',
    path: cookiePath,
    maxAge: sessionLifetime,
  });
  return sessionResponse(user, c.env, sessionId);
}

export async function sessionResponse(user: AuthUser, env: Env, sessionId: string) {
  return { access_token: await createAccessToken(user, env, sessionId), token_type: 'bearer', expires_in: 1800 };
}

export async function refreshSession(c: SessionContext) {
  const token = getCookie(c, cookieName);
  if (!token) return null;
  return c.env.DB.prepare(
    `SELECT users.id, users.username, users.role, sessions.id AS session_id
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.is_active = 1`
  ).bind(await tokenHash(token), Math.floor(Date.now() / 1000)).first<AuthUser & { session_id: string }>();
}
