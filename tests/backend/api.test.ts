import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compare, hashSync } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import app from '../../cloudflare/src/index';
import { createAccessToken } from '../../cloudflare/src/auth';
import type { Env } from '../../cloudflare/src/types';
import { createTestDatabase } from './helpers/database';

let database: ReturnType<typeof createTestDatabase>;
let env: Env;
let token: string;

async function request(path: string, method = 'GET', body?: unknown, authorization = `Bearer ${token}`) {
  return app.request(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: authorization },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, env);
}

beforeEach(async () => {
  database = createTestDatabase();
  env = { DB: database.database, JWT_SECRET: 'test-secret-for-api' } as Env;
  database.sqlite.prepare('INSERT INTO users (username, hashed_password) VALUES (?, ?)').run('alice', hashSync('password', 4));
  database.sqlite.prepare('INSERT INTO users (username, hashed_password) VALUES (?, ?)').run('bob', hashSync('password', 4));
  token = await createAccessToken({ id: 1, username: 'alice', role: 'User' }, env);
});

afterEach(() => database.sqlite.close());

describe('worker', () => {
  it('returns health and CORS headers', async () => {
    const response = await app.request('/api/health', { headers: { Origin: 'http://localhost' } }, env);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost');
  });

  it('serves assets and returns a JSON 404 without assets', async () => {
    expect((await app.request('/missing', {}, env)).status).toBe(404);
    const fetch = vi.fn().mockResolvedValue(new Response('frontend'));
    env.ASSETS = { fetch } as unknown as Env['ASSETS'];
    expect(await (await app.request('/dashboard', {}, env)).text()).toBe('frontend');
    expect(fetch).toHaveBeenCalledWith(expect.any(Request));
  });

  it('returns a client error for malformed JSON', async () => {
    const response = await app.request('/api/users', { method: 'POST', body: '{' }, env);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ detail: 'Invalid JSON body' });
  });
});

describe('registration and login', () => {
  it.each([null, [], 42, 'credentials'])('rejects non-object authentication bodies: %j', async (body) => {
    for (const path of ['/users/', '/users/token']) {
      const response = await request(path, 'POST', body);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ detail: 'Request body must be an object' });
    }
  });

  it.each([
    { username: 42, password: 'secret' },
    { username: {}, password: 'secret' },
    { username: 'carol', password: 42 },
    { username: 'carol', password: {} },
    { username: null, password: null },
  ])('rejects incorrectly typed credentials without writing users: %j', async (body) => {
    expect((await request('/users/', 'POST', body)).status).toBe(400);
    expect((await request('/users/token', 'POST', body)).status).toBe(401);
    expect(database.sqlite.prepare('SELECT COUNT(*) AS count FROM users').get()?.count).toBe(2);
    expect(database.sqlite.prepare('SELECT COUNT(*) AS count FROM sessions').get()?.count).toBe(0);
  });

  it('checks bcrypt password limits in UTF-8 bytes without truncating passwords', async () => {
    expect((await request('/users/', 'POST', { username: 'carol', password: 'é'.repeat(36) })).status).toBe(201);
    const response = await request('/users/', 'POST', { username: 'dave', password: 'é'.repeat(37) });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ detail: 'Password must not exceed 72 UTF-8 bytes' });
    expect(database.sqlite.prepare('SELECT id FROM users WHERE username = ?').get('dave')).toBeUndefined();
  });

  it('returns conflict if another registration wins after the username lookup', async () => {
    const lookup = env.DB.prepare('SELECT id FROM users WHERE username = ?');
    vi.spyOn(lookup, 'bind').mockReturnValue(lookup);
    vi.spyOn(lookup, 'first').mockResolvedValue(null);
    vi.spyOn(env.DB, 'prepare').mockReturnValueOnce(lookup);
    expect((await request('/users/', 'POST', { username: 'alice', password: 'secret' })).status).toBe(409);
    expect(database.sqlite.prepare('SELECT COUNT(*) AS count FROM users').get()?.count).toBe(2);
  });

  it('does not issue tokens when the JWT secret is missing', async () => {
    env.JWT_SECRET = '';
    await expect(createAccessToken({ id: 1, username: 'alice', role: 'User' }, env)).rejects.toThrow('JWT_SECRET is required');
  });
  it.each(['/users', '/users/'])('registers at %s with a hashed password', async (path) => {
    const response = await request(path, 'POST', { username: ' carol ', password: 'secret' });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ username: 'carol', role: 'User' });
    const row = database.sqlite.prepare('SELECT hashed_password FROM users WHERE username = ?').get('carol');
    expect(row?.hashed_password).not.toBe('secret');
    expect(await compare('secret', String(row?.hashed_password))).toBe(true);
  });

  it.each([{}, { username: '  ', password: 'secret' }, { username: 'carol' }])('rejects missing registration fields: %j', async (body) => {
    expect((await request('/users', 'POST', body)).status).toBe(400);
  });

  it('rejects duplicate usernames', async () => {
    expect((await request('/users', 'POST', { username: 'alice', password: 'secret' })).status).toBe(409);
  });

  it.each(['json', 'urlencoded', 'multipart'])('logs in using %s and issues a valid token', async (format) => {
    const credentials = { username: ' alice ', password: 'password' };
    let body: BodyInit = JSON.stringify(credentials);
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (format === 'urlencoded') {
      body = new URLSearchParams(credentials);
      headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    } else if (format === 'multipart') {
      const form = new FormData();
      Object.entries(credentials).forEach(([key, value]) => form.append(key, value));
      body = form;
      headers = {};
    }
    const response = await app.request('/api/users/token', { method: 'POST', headers, body }, env);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.token_type).toBe('bearer');
    const { payload } = await jwtVerify(result.access_token, new TextEncoder().encode(env.JWT_SECRET));
    expect(payload).toMatchObject({ sub: 'alice', userId: 1, role: 'User', iss: 'taskmanager-app' });
    expect(payload.exp! - payload.iat!).toBe(1800);
  });

  it.each(['username', 'password'])('rejects a file uploaded as the %s credential', async (field) => {
    const username = field === 'username' ? '[object File]' : 'alice';
    const password = field === 'password' ? '[object File]' : 'password';
    database.sqlite.prepare('UPDATE users SET username = ?, hashed_password = ? WHERE id = 1').run(username, hashSync(password, 4));

    const form = new FormData();
    form.append('username', username);
    form.append('password', password);
    form.set(field, new File(['credential'], 'credential.txt', { type: 'text/plain' }));

    const response = await app.request('/api/users/token', { method: 'POST', body: form }, env);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ detail: 'Invalid credentials' });
  });

  it.each([{}, { username: 'alice' }, { username: 'missing', password: 'password' }, { username: 'alice', password: 'wrong' }])('rejects invalid credentials: %j', async (body) => {
    expect((await request('/users/token', 'POST', body)).status).toBe(401);
  });

  it('rejects inactive accounts at login and authenticated routes', async () => {
    database.sqlite.exec('UPDATE users SET is_active = 0 WHERE id = 1');
    expect((await request('/users/token', 'POST', { username: 'alice', password: 'password' })).status).toBe(401);
    expect((await request('/tasks/')).status).toBe(401);
  });
});

describe('authentication', () => {
  it.each(['', 'Basic abc', 'Bearer ', 'Bearer invalid'])('rejects invalid authorization %s', async (authorization) => {
    expect((await request('/tasks/', 'GET', undefined, authorization)).status).toBe(401);
  });

  it.each([
    { sub: 'alice', userId: 1.5 },
    { sub: '', userId: 1 },
    { sub: 'missing', userId: 1 },
    { sub: 'alice', userId: 999 },
  ])('rejects unusable token claims %j', async (claims) => {
    const invalid = await new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).setIssuer('taskmanager-app').setIssuedAt().setExpirationTime('30m').sign(new TextEncoder().encode(env.JWT_SECRET));
    expect((await request('/tasks/', 'GET', undefined, `Bearer ${invalid}`)).status).toBe(401);
  });

  it('honors a configured issuer and rejects expired tokens', async () => {
    env.JWT_ISSUER = 'custom-issuer';
    token = await createAccessToken({ id: 1, username: 'alice', role: 'User' }, env);
    expect((await request('/tasks/')).status).toBe(200);
    const expired = await new SignJWT({ sub: 'alice', userId: 1 }).setProtectedHeader({ alg: 'HS256' }).setIssuer(env.JWT_ISSUER).setIssuedAt().setExpirationTime(0).sign(new TextEncoder().encode(env.JWT_SECRET));
    expect((await request('/tasks/', 'GET', undefined, `Bearer ${expired}`)).status).toBe(401);
  });
});

describe('tasks', () => {
  it.each(['POST', 'PUT', 'PATCH'])('validates untrusted JSON before database writes for %s', async (method) => {
    await request('/tasks/', 'POST', { title: 'Original', description: 'Keep', deadline: '2026-10-01' });
    const path = method === 'POST' ? '/tasks/' : '/tasks/1';
    for (const body of [
      null, [], 42, 'task',
      { title: null }, { title: 42 }, { title: false },
      { title: 'Task', description: null }, { title: 'Task', description: {} },
      { title: 'Task', status: null }, { title: 'Task', status: false }, { title: 'Task', status: '' },
      { title: 'Task', deadline: 42 }, { title: 'Task', deadline: {} },
      { title: 'Task', deadline: 'not-a-date' }, { title: 'Task', deadline: '2026-02-30' },
      { title: 'Task', deadline: '2026-13-01' },
    ]) {
      const response = await request(path, method, body);
      expect(response.status, JSON.stringify(body)).toBe(400);
      expect((await response.json()).detail).toEqual(expect.any(String));
    }
    expect(await (await request('/tasks/')).json()).toEqual([
      expect.objectContaining({ title: 'Original', description: 'Keep', deadline: '2026-10-01' }),
    ]);
  });

  it('accepts leap days, ISO timestamps, and explicit deadline removal', async () => {
    const created = await request('/tasks/', 'POST', { title: 'Leap day', deadline: '2028-02-29' });
    expect(created.status).toBe(201);
    expect(await (await request('/tasks/1', 'PUT', { title: 'Timestamp', deadline: '2028-02-29T12:30:00Z' })).json())
      .toMatchObject({ deadline: '2028-02-29T12:30:00Z' });
    expect(await (await request('/tasks/1', 'PATCH', { deadline: null })).json()).toMatchObject({ deadline: null });
  });

  it('returns a server error if a task insert unexpectedly returns no row', async () => {
    const prepare = env.DB.prepare.bind(env.DB);
    vi.spyOn(env.DB, 'prepare').mockImplementation((sql) => {
      const statement = prepare(sql);
      if (sql.includes('INSERT INTO tasks')) {
        vi.spyOn(statement, 'bind').mockReturnValue(statement);
        vi.spyOn(statement, 'first').mockResolvedValue(null);
      }
      return statement;
    });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request('/tasks/', 'POST', { title: 'New task' });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ detail: 'Internal server error' });
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: 'Task insert returned no row' }));
  });
  it.each(['POST', 'PUT', 'PATCH'])('rejects invalid priorities for %s', async (method) => {
    const path = method === 'POST' ? '/tasks/' : '/tasks/1';
    expect((await request(path, method, { title: 'Task', priority: 'urgent' })).status).toBe(400);
    expect((await request(path, method, { title: 'Task', priority: null })).status).toBe(400);
  });

  it('sorts priorities and preserves them during unrelated updates', async () => {
    for (const priority of ['low', 'high', 'medium']) await request('/tasks/', 'POST', { title: priority, priority });
    expect(await (await request('/tasks/?order_by=priority')).json()).toEqual([
      expect.objectContaining({ priority: 'high' }), expect.objectContaining({ priority: 'medium' }), expect.objectContaining({ priority: 'low' }),
    ]);
    expect(await (await request('/tasks/1', 'PUT', { title: 'Renamed' })).json()).toMatchObject({ priority: 'low' });
    expect(await (await request('/tasks/1', 'PATCH', { priority: 'high' })).json()).toMatchObject({ title: 'Renamed', priority: 'high' });
    expect(await (await request('/tasks/1', 'PUT', { title: 'Renamed', priority: 'medium' })).json()).toMatchObject({ priority: 'medium' });
    expect((await request('/tasks/?skip=invalid')).status).toBe(400);
    expect((await request('/tasks/?limit=1.5')).status).toBe(400);
  });
  it.each(['/tasks', '/tasks/'])('creates and lists tasks at %s with defaults', async (path) => {
    const response = await request(path, 'POST', { title: ' First task ' });
    expect(response.status).toBe(201);
    const task = await response.json();
    expect(task).toMatchObject({ id: 1, title: 'First task', description: '', deadline: null, status: 'pending' });
    expect(task).not.toHaveProperty('owner_id');
    expect(await (await request(path)).json()).toEqual([task]);
    expect(await (await request('/tasks/1')).json()).toEqual(task);
  });

  it.each(['POST', 'PUT', 'PATCH'])('validates titles and statuses for %s', async (method) => {
    const path = method === 'POST' ? '/tasks/' : '/tasks/1';
    expect((await request(path, method, { title: ' ' })).status).toBe(400);
    expect((await request(path, method, { title: 'Task', status: 'invalid' })).status).toBe(400);
  });

  it('replaces and partially updates a task, preserving omitted fields', async () => {
    await request('/tasks/', 'POST', { title: 'Original' });
    const updated = await request('/tasks/1', 'PUT', { title: ' Updated ', description: 'Details', status: 'done', deadline: '2026-10-01' });
    expect(await updated.json()).toMatchObject({ title: 'Updated', description: 'Details', status: 'done', deadline: '2026-10-01' });
    expect(await (await request('/tasks/1', 'PATCH', { title: ' Partial ', description: 'Changed', status: 'in_progress', deadline: '' })).json()).toMatchObject({ title: 'Partial', description: 'Changed', status: 'in_progress', deadline: null });
    await request('/tasks/1', 'PATCH', { title: 'Only title' });
    expect(await (await request('/tasks/1', 'PATCH', {})).json()).toMatchObject({ title: 'Only title', description: 'Changed', status: 'in_progress' });
    expect(await (await request('/tasks/1', 'PUT', { title: 'Reset' })).json()).toMatchObject({ description: '', status: 'pending', deadline: null });
  });

  it.each(['GET', 'PUT', 'PATCH', 'DELETE'])('protects another owner and missing tasks for %s', async (method) => {
    database.sqlite.exec("INSERT INTO tasks (title, owner_id) VALUES ('Private', 2)");
    for (const id of [1, 999]) {
      expect((await request(`/tasks/${id}`, method, method === 'PUT' || method === 'PATCH' ? { title: 'Stolen' } : undefined)).status).toBe(404);
    }
    expect(await (await request('/tasks/')).json()).toEqual([]);
    expect(database.sqlite.prepare('SELECT title FROM tasks WHERE id = 1').get()?.title).toBe('Private');
  });

  it('deletes a task', async () => {
    await request('/tasks/', 'POST', { title: 'Remove' });
    expect(await (await request('/tasks/1', 'DELETE')).json()).toEqual({ detail: 'Task successfully deleted' });
    expect((await request('/tasks/1')).status).toBe(404);
  });

  it('combines search, status and deadline filters, sorting and pagination', async () => {
    for (const task of [
      { title: 'Alpha', status: 'done', deadline: '2026-10-01' },
      { title: 'Beta', status: 'pending', deadline: '2026-10-02' },
      { title: 'ALPINE', status: 'done', deadline: '2026-10-03' },
      { title: 'Alphabet', status: 'done' },
    ]) await request('/tasks/', 'POST', task);
    expect(await (await request('/tasks/?search=alp&status=done&before_deadline=2026-10-02')).json()).toEqual([expect.objectContaining({ title: 'Alpha' })]);
    expect(await (await request('/tasks/?order_by=title&skip=1&limit=1')).json()).toEqual([expect.objectContaining({ title: 'Alpha' })]);
    expect(await (await request('/tasks/?skip=-1&limit=0&order_by=invalid&status=invalid')).json()).toHaveLength(1);
    expect(await (await request('/tasks/?limit=1000')).json()).toHaveLength(4);
  });
});
