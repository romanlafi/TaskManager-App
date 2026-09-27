import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireAuth, currentUser } from '../auth';
import type { AuthUser, Env, TaskInput, TaskRow, TaskStatus } from '../types';

type TaskContext = Context<{ Bindings: Env; Variables: { user: AuthUser } }>;
const tasks = new Hono<{ Bindings: Env; Variables: { user: AuthUser } }>();
const statuses = new Set<TaskStatus>(['pending', 'in_progress', 'done']);
const orderFields = new Set(['created_at', 'title', 'description', 'deadline', 'status']);

function taskResponse(task: TaskRow) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    created_at: task.created_at,
    status: task.status,
    deadline: task.deadline,
  };
}

function validStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && statuses.has(value as TaskStatus);
}

async function listTasks(c: TaskContext) {
  const user = currentUser(c);
  const query = c.req.query();
  const skip = Math.max(Number(query.skip || 0), 0);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const orderBy = orderFields.has(query.order_by) ? query.order_by : 'created_at';
  const conditions = ['owner_id = ?'];
  const bindings: (string | number)[] = [user.id];

  if (query.search) {
    conditions.push('LOWER(title) LIKE LOWER(?)');
    bindings.push(`%${query.search}%`);
  }
  if (query.status && validStatus(query.status)) {
    conditions.push('status = ?');
    bindings.push(query.status);
  }
  if (query.before_deadline) {
    conditions.push('deadline IS NOT NULL AND deadline <= ?');
    bindings.push(query.before_deadline);
  }

  const result = await c.env.DB.prepare(
    `SELECT id, title, description, created_at, status, deadline, owner_id
     FROM tasks WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy} ASC LIMIT ? OFFSET ?`
  ).bind(...bindings, limit, skip).all<TaskRow>();

  return c.json(result.results.map(taskResponse));
}

async function createTask(c: TaskContext) {
  const user = currentUser(c);
  const body = await c.req.json<TaskInput>();
  const title = body.title?.trim();

  if (!title) return c.json({ detail: 'Title is required' }, 400);
  if (body.status && !validStatus(body.status)) return c.json({ detail: 'Invalid task status' }, 400);

  const result = await c.env.DB.prepare(
    `INSERT INTO tasks (title, description, status, deadline, owner_id)
     VALUES (?, ?, ?, ?, ?) RETURNING id, title, description, created_at, status, deadline, owner_id`
  ).bind(title, body.description || '', body.status || 'pending', body.deadline || null, user.id).first<TaskRow>();

  return c.json(taskResponse(result!), 201);
}

async function getTask(c: TaskContext) {
  const task = await c.env.DB.prepare(
    'SELECT id, title, description, created_at, status, deadline, owner_id FROM tasks WHERE id = ? AND owner_id = ?'
  ).bind(c.req.param('task_id'), currentUser(c).id).first<TaskRow>();
  if (!task) return c.json({ detail: 'Task not found or unauthorized' }, 404);
  return c.json(taskResponse(task));
}

async function updateTask(c: TaskContext) {
  const body = await c.req.json<TaskInput>();
  if (!body.title?.trim()) return c.json({ detail: 'Title is required' }, 400);
  if (body.status && !validStatus(body.status)) return c.json({ detail: 'Invalid task status' }, 400);

  const result = await c.env.DB.prepare(
    `UPDATE tasks SET title = ?, description = ?, status = ?, deadline = ?
     WHERE id = ? AND owner_id = ?
     RETURNING id, title, description, created_at, status, deadline, owner_id`
  ).bind(body.title.trim(), body.description || '', body.status || 'pending', body.deadline || null,
    c.req.param('task_id'), currentUser(c).id).first<TaskRow>();

  if (!result) return c.json({ detail: 'Task not found or unauthorized' }, 404);
  return c.json(taskResponse(result));
}

async function patchTask(c: TaskContext) {
  const body = await c.req.json<Partial<TaskInput>>();
  const updates: string[] = [];
  const bindings: (string | number | null)[] = [];

  if (body.title !== undefined) {
    if (!body.title.trim()) return c.json({ detail: 'Title is required' }, 400);
    updates.push('title = ?');
    bindings.push(body.title.trim());
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    bindings.push(body.description);
  }
  if (body.status !== undefined) {
    if (!validStatus(body.status)) return c.json({ detail: 'Invalid task status' }, 400);
    updates.push('status = ?');
    bindings.push(body.status);
  }
  if (body.deadline !== undefined) {
    updates.push('deadline = ?');
    bindings.push(body.deadline || null);
  }
  if (!updates.length) return getTask(c);

  const result = await c.env.DB.prepare(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?
     RETURNING id, title, description, created_at, status, deadline, owner_id`
  ).bind(...bindings, c.req.param('task_id'), currentUser(c).id).first<TaskRow>();

  if (!result) return c.json({ detail: 'Task not found or unauthorized' }, 404);
  return c.json(taskResponse(result));
}

async function deleteTask(c: TaskContext) {
  const result = await c.env.DB.prepare(
    'DELETE FROM tasks WHERE id = ? AND owner_id = ?'
  ).bind(c.req.param('task_id'), currentUser(c).id).run();

  if (!result.meta.changes) return c.json({ detail: 'Task not found or unauthorized' }, 404);
  return c.json({ detail: 'Task successfully deleted' });
}

tasks.use('/tasks/*', requireAuth);
tasks.get('/tasks', listTasks);
tasks.get('/tasks/', listTasks);
tasks.post('/tasks', createTask);
tasks.post('/tasks/', createTask);
tasks.get('/tasks/:task_id', getTask);
tasks.put('/tasks/:task_id', updateTask);
tasks.patch('/tasks/:task_id', patchTask);
tasks.delete('/tasks/:task_id', deleteTask);

export default tasks;
