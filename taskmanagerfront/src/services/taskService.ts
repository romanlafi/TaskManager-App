import { API_ENDPOINTS, HTTP_METHODS } from '../config/api';
import type { Task, TaskStatus } from '../types';

const getToken = () => localStorage.getItem('access_token');

export const fetchTasks = async (
  skip: number,
  limit: number,
  search: string,
  orderBy: string,
  status: string,
  beforeDeadline: string,
) => {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
    search,
    order_by: orderBy,
  });
  if (status) params.append('status', status);
  if (beforeDeadline) params.append('before_deadline', beforeDeadline);

  const response = await fetch(`${API_ENDPOINTS.TASKS}?${params.toString()}`, {
    method: HTTP_METHODS.GET,
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const data: Task[] = await response.json();
  return { status: response.status, data };
};

export const createTask = async (
  title: string,
  description: string,
  deadline: string,
): Promise<Task> => {
  const response = await fetch(API_ENDPOINTS.TASKS, {
    method: HTTP_METHODS.POST,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title, description, deadline }),
  });
  return response.json();
};

export const deleteTask = async (taskId: number): Promise<void> => {
  await fetch(`${API_ENDPOINTS.TASKS}${taskId}`, {
    method: HTTP_METHODS.DELETE,
    headers: { Authorization: `Bearer ${getToken()}` },
  });
};

export const updateTask = async (
  taskId: number,
  title: string,
  description: string,
  status: TaskStatus,
  deadline: string,
): Promise<Task> => {
  const response = await fetch(`${API_ENDPOINTS.TASKS}${taskId}`, {
    method: HTTP_METHODS.PUT,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title, description, status, deadline }),
  });
  return response.json();
};
