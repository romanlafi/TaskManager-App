import { API_ENDPOINTS, HTTP_METHODS } from '../config/api';
import type { Task, TaskStatus } from '../types';

import { authenticatedRequest } from './http';

export const fetchTasks = async (
  skip: number,
  limit: number,
  search: string,
  orderBy: string,
  status: string,
  beforeDeadline: string,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
    search,
    order_by: orderBy,
  });
  if (status) params.append('status', status);
  if (beforeDeadline) params.append('before_deadline', beforeDeadline);

  const data = await authenticatedRequest<Task[]>(`${API_ENDPOINTS.TASKS}?${params.toString()}`, {
    method: HTTP_METHODS.GET,
    signal,
  });

  return { status: 200, data };
};

export const createTask = async (
  title: string,
  description: string,
  deadline: string,
): Promise<Task> => {
  return authenticatedRequest<Task>(API_ENDPOINTS.TASKS, {
    method: HTTP_METHODS.POST,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, description, deadline }),
  });
};

export const deleteTask = async (taskId: number): Promise<void> => {
  await authenticatedRequest(`${API_ENDPOINTS.TASKS}${taskId}`, {
    method: HTTP_METHODS.DELETE,
  });
};

export const updateTask = async (
  taskId: number,
  title: string,
  description: string,
  status: TaskStatus,
  deadline: string,
): Promise<Task> => {
  return authenticatedRequest<Task>(`${API_ENDPOINTS.TASKS}${taskId}`, {
    method: HTTP_METHODS.PUT,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, description, status, deadline }),
  });
};
