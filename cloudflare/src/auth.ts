import { createMiddleware } from 'hono/factory';
import { jwtVerify, SignJWT } from 'jose';
import type { Context } from 'hono';
import type { AuthUser, Env, UserRow } from './types';

const getSecret = (env: Env) => new TextEncoder().encode(env.JWT_SECRET);

export async function createAccessToken(user: AuthUser, env: Env) {
  return new SignJWT({ sub: user.username, userId: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(env.JWT_ISSUER || 'taskmanager-app')
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(getSecret(env));
}

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: { user: AuthUser } }>(
  async (c, next) => {
    const authorization = c.req.header('Authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;

    if (!token) return c.json({ detail: 'Invalid credentials' }, 401);

    try {
      const { payload } = await jwtVerify(token, getSecret(c.env), {
        issuer: c.env.JWT_ISSUER || 'taskmanager-app',
      });
      const userId = Number(payload.userId);
      const username = typeof payload.sub === 'string' ? payload.sub : '';

      if (!Number.isInteger(userId) || !username) {
        return c.json({ detail: 'Invalid credentials' }, 401);
      }

      const user = await c.env.DB.prepare(
        'SELECT id, username, hashed_password, is_active, role FROM users WHERE id = ? AND username = ?'
      ).bind(userId, username).first<UserRow>();

      if (!user?.is_active) return c.json({ detail: 'Invalid credentials' }, 401);

      c.set('user', { id: user.id, username: user.username, role: user.role });
      await next();
    } catch {
      return c.json({ detail: 'Invalid credentials' }, 401);
    }
  }
);

export function currentUser(c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>) {
  return c.get('user');
}
