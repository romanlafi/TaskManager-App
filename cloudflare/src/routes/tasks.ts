import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireAuth } from '../auth';
import { HTTPException } from 'hono/http-exception';
import { readJsonObject } from '../request';
import type { AuthUser, Env, TaskInput, TaskRow, TaskStatus, TaskPriority } from '../types';

type TaskContext = Context<{ Bindings: Env; Variables: { user: AuthUser } }>;
const tasks = new Hono<{ Bindings: Env; Variables: { user: AuthUser } }>();
const orderFields = new Set(['created_at', 'title', 'description', 'deadline', 'status', 'priority']);
const VALID_STATUSES = new Set<TaskStatus>(['pending', 'in_progress', 'done']);
const VALID_PRIORITIES = new Set<TaskPriority>(['low', 'medium', 'high']);

function taskResponse(task: TaskRow) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    created_at: task.created_at,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
  };
}

function validStatus(value: unknown): value is TaskStatus {
  return VALID_STATUSES.has(value as TaskStatus);
}

function validPriority(value: unknown): value is TaskPriority {
  return VALID_PRIORITIES.has(value as TaskPriority);
}

function parseDeadline(value: unknown): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new HTTPException(400, { message: 'Invalid task deadline' });
  const day = value.slice(0, 10);
  const date = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(date.getTime()) ||
      new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) {
    throw new HTTPException(400, { message: 'Invalid task deadline' });
  }
  return value;
}

async function readTaskInput(c: TaskContext, requireTitle = true): Promise<Partial<TaskInput>> {
  const body = await readJsonObject(c);
  const task: Partial<TaskInput> = {};
  if (requireTitle || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw new HTTPException(400, { message: 'Title is required' });
    }
    task.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') throw new HTTPException(400, { message: 'Invalid task description' });
    task.description = body.description;
  }
  if (body.status !== undefined) {
    if (!validStatus(body.status)) throw new HTTPException(400, { message: 'Invalid task status' });
    task.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!validPriority(body.priority)) throw new HTTPException(400, { message: 'Invalid task priority' });
    task.priority = body.priority;
  }
  if (body.deadline !== undefined) {
    task.deadline = parseDeadline(body.deadline);
  }
  return task;
}

async function listTasks(c: TaskContext) {
  const user = c.get('user');
  const query = c.req.query();
  const skip = Math.max(Number(query.skip || 0), 0);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  if (!Number.isInteger(skip) || !Number.isInteger(limit)) {
    return c.json({ detail: 'Invalid pagination' }, 400);
  }
  const orderBy = orderFields.has(query.order_by) ? query.order_by : 'created_at';
  const ordering = orderBy === 'priority'
    ? "CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END"
    : orderBy;
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
    `SELECT id, title, description, created_at, status, priority, deadline, owner_id
     FROM tasks WHERE ${conditions.join(' AND ')}
     ORDER BY ${ordering} ASC, id ASC LIMIT ? OFFSET ?`
  ).bind(...bindings, limit, skip).all<TaskRow>();

  return c.json(result.results.map(taskResponse));
}

async function createTask(c: TaskContext) {
  const user = c.get('user');
  const body = await readTaskInput(c);

  const result = await c.env.DB.prepare(
    `INSERT INTO tasks (title, description, status, priority, deadline, owner_id)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING id, title, description, created_at, status, priority, deadline, owner_id`
  ).bind(body.title, body.description ?? '', body.status ?? 'pending', body.priority ?? 'medium', body.deadline ?? null, user.id).first<TaskRow>();

  if (!result) throw new Error('Task insert returned no row');
  return c.json(taskResponse(result), 201);
}

async function getTask(c: TaskContext) {
  const task = await c.env.DB.prepare(
    'SELECT id, title, description, created_at, status, priority, deadline, owner_id FROM tasks WHERE id = ? AND owner_id = ?'
  ).bind(c.req.param('task_id'), c.get('user').id).first<TaskRow>();
  if (!task) return c.json({ detail: 'Task not found or unauthorized' }, 404);
  return c.json(taskResponse(task));
}

async function updateTask(c: TaskContext) {
  const body = await readTaskInput(c);

  const result = await c.env.DB.prepare(
    `UPDATE tasks SET title = ?, description = ?, status = ?, priority = COALESCE(?, priority), deadline = ?
     WHERE id = ? AND owner_id = ?
     RETURNING id, title, description, created_at, status, priority, deadline, owner_id`
  ).bind(body.title, body.description ?? '', body.status ?? 'pending', body.priority ?? null, body.deadline ?? null,
    c.req.param('task_id'), c.get('user').id).first<TaskRow>();

  if (!result) return c.json({ detail: 'Task not found or unauthorized' }, 404);
  return c.json(taskResponse(result));
}

async function patchTask(c: TaskContext) {
  const body = await readTaskInput(c, false);
  const updates: string[] = [];
  const bindings: (string | number | null)[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    bindings.push(body.title);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    bindings.push(body.description);
  }
  if (body.status !== undefined) {
    updates.push('status = ?');
    bindings.push(body.status);
  }
  if (body.deadline !== undefined) {
    updates.push('deadline = ?');
    bindings.push(body.deadline || null);
  }
  if (body.priority !== undefined) {
    updates.push('priority = ?');
    bindings.push(body.priority);
  }
  if (!updates.length) return getTask(c);

  const result = await c.env.DB.prepare(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?
     RETURNING id, title, description, created_at, status, priority, deadline, owner_id`
  ).bind(...bindings, c.req.param('task_id'), c.get('user').id).first<TaskRow>();

  if (!result) return c.json({ detail: 'Task not found or unauthorized' }, 404);
  return c.json(taskResponse(result));
}

async function deleteTask(c: TaskContext) {
  const result = await c.env.DB.prepare(
    'DELETE FROM tasks WHERE id = ? AND owner_id = ?'
  ).bind(c.req.param('task_id'), c.get('user').id).run();

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
