import { Hono } from 'hono';
import type { Context } from 'hono';
import { compare, hash } from 'bcryptjs';
import { refreshSession, revokeSession, sessionResponse, startSession, trustedOrigin } from '../sessions';
import type { Env, UserRow } from '../types';

const users = new Hono<{ Bindings: Env }>();

users.use('/users/*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  if (!trustedOrigin(c)) return c.json({ detail: 'Untrusted origin' }, 403);
  await next();
});

type UserContext = Context<{ Bindings: Env }>;

async function parseLoginForm(c: UserContext) {
  const contentType = c.req.header('Content-Type') || '';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const body = await c.req.parseBody();
    return {
      username: typeof body.username === 'string' ? body.username : '',
      password: typeof body.password === 'string' ? body.password : '',
    };
  }
  return await c.req.json<{ username?: string; password?: string }>();
}

async function register(c: UserContext) {
  const body = await c.req.json<{ username?: string; password?: string }>();
  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) return c.json({ detail: 'Username and password are required' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (existing) return c.json({ detail: 'Username already exists' }, 409);

  const hashedPassword = await hash(password, 10);
  await c.env.DB.prepare(
    'INSERT INTO users (username, hashed_password) VALUES (?, ?)'
  ).bind(username, hashedPassword).run();

  return c.json({ username, role: 'User' }, 201);
}

async function login(c: UserContext) {
  const body = await parseLoginForm(c);
  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) return c.json({ detail: 'Invalid credentials' }, 401);

  const user = await c.env.DB.prepare(
    'SELECT id, username, hashed_password, is_active, role FROM users WHERE username = ?'
  ).bind(username).first<UserRow>();

  if (!user?.is_active || !(await compare(password, user.hashed_password))) {
    return c.json({ detail: 'Invalid credentials' }, 401);
  }

  return c.json(await startSession(c, user));
}

users.post('/users', register);
users.post('/users/', register);
users.post('/users/token', login);
users.post('/users/refresh', async (c) => {
  const user = await refreshSession(c);
  if (!user) {
    await revokeSession(c);
    return c.json({ detail: 'Session expired' }, 401);
  }
  return c.json(await sessionResponse(user, c.env, user.session_id));
});
users.post('/users/logout', async (c) => {
  await revokeSession(c);
  return c.body(null, 204);
});

export default users;
