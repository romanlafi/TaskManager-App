import { API_ENDPOINTS } from '../config/api';
import type { Task, TaskFormData, TaskStatus } from '../types';
import { authenticatedRequest } from './http';

async function requestTask<Result>(url: string, options: RequestInit = {}): Promise<Result> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return authenticatedRequest<Result>(url, {
    ...options,
    headers,
  });
}

// Load every page so the board and calendar never silently omit tasks.
export async function fetchTasks(signal?: AbortSignal): Promise<Task[]> {
  const tasks: Task[] = [];
  const pageSize = 100;
  for (let skip = 0; ; skip += pageSize) {
    const params = new URLSearchParams({ skip: String(skip), limit: String(pageSize), order_by: 'created_at' });
    const page = await requestTask<Task[]>(API_ENDPOINTS.TASKS + '?' + params, { signal });
    tasks.push(...page);
    if (page.length < pageSize) return tasks;
  }
}

export const createTask = (data: TaskFormData) =>
  requestTask<Task>(API_ENDPOINTS.TASKS, { method: 'POST', body: JSON.stringify(data) });

export const updateTask = (id: number, data: TaskFormData) =>
  requestTask<Task>(API_ENDPOINTS.TASKS + id, { method: 'PUT', body: JSON.stringify(data) });

export const changeTaskStatus = (id: number, status: TaskStatus) =>
  requestTask<Task>(API_ENDPOINTS.TASKS + id, { method: 'PATCH', body: JSON.stringify({ status }) });

export const deleteTask = (id: number) => requestTask<{ detail: string }>(API_ENDPOINTS.TASKS + id, { method: 'DELETE' });
