import { Hono } from 'hono';
import type { Context } from 'hono';
import { compare, hash } from 'bcryptjs';
import { createAccessToken } from '../auth';
import type { Env, UserRow } from '../types';

const users = new Hono<{ Bindings: Env }>();

type UserContext = Context<{ Bindings: Env }>;

async function parseLoginForm(c: UserContext) {
  const contentType = c.req.header('Content-Type') || '';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const body = await c.req.parseBody();
    return { username: String(body.username || ''), password: String(body.password || '') };
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
  const result = await c.env.DB.prepare(
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

  if (!user || !user.is_active || !(await compare(password, user.hashed_password))) {
    return c.json({ detail: 'Invalid credentials' }, 401);
  }

  return c.json({
    access_token: await createAccessToken(user, c.env),
    token_type: 'bearer',
  });
}

users.post('/users', register);
users.post('/users/', register);
users.post('/users/token', login);

export default users;
