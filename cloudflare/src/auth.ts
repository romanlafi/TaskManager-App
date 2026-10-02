import { createMiddleware } from 'hono/factory';
import { jwtVerify, SignJWT } from 'jose';
import type { JWTPayload } from 'jose';
import type { AuthUser, Env, UserRow } from './types';

export const ACCESS_TOKEN_LIFETIME_SECONDS = 30 * 60;

const getSecret = (env: Env) => {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  return new TextEncoder().encode(env.JWT_SECRET);
};

export async function createAccessToken(user: AuthUser, env: Env, sessionId?: string) {
  return new SignJWT({ sub: user.username, userId: user.id, role: user.role, ...(sessionId ? { sid: sessionId } : {}) })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(env.JWT_ISSUER || 'taskmanager-app')
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_LIFETIME_SECONDS}s`)
    .sign(getSecret(env));
}

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: { user: AuthUser } }>(
  async (c, next) => {
    const authorization = c.req.header('Authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;

    if (!token) return c.json({ detail: 'Invalid credentials' }, 401);

    let payload: JWTPayload;
    try {
      ({ payload } = await jwtVerify(token, getSecret(c.env), {
        issuer: c.env.JWT_ISSUER || 'taskmanager-app',
        algorithms: ['HS256'],
        requiredClaims: ['exp', 'iat', 'sub'],
      }));
    } catch {
      return c.json({ detail: 'Invalid credentials' }, 401);
    }
    const userId = Number(payload.userId);
    const username = typeof payload.sub === 'string' ? payload.sub : '';

    if (!Number.isInteger(userId) || !username) {
      return c.json({ detail: 'Invalid credentials' }, 401);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, username, is_active, role FROM users WHERE id = ? AND username = ?'
    ).bind(userId, username).first<Omit<UserRow, 'hashed_password'>>();

    if (!user?.is_active) return c.json({ detail: 'Invalid credentials' }, 401);

    if (payload.sid !== undefined) {
      if (typeof payload.sid !== 'string') return c.json({ detail: 'Invalid credentials' }, 401);
      const session = await c.env.DB.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ? AND expires_at > ?')
        .bind(payload.sid, user.id, Math.floor(Date.now() / 1000)).first();
      if (!session) return c.json({ detail: 'Invalid credentials' }, 401);
    }

    c.set('user', { id: user.id, username: user.username, role: user.role });
    await next();
  }
);
