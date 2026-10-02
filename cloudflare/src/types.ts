import type { Task, TaskStatus, TaskPriority } from '@taskmanager/types';
export type { TaskStatus, TaskPriority };

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  JWT_ISSUER?: string;
  FRONTEND_ORIGIN?: string;
}

export interface UserRow {
  id: number;
  username: string;
  hashed_password: string;
  is_active: number;
  role: string;
}

export interface TaskRow extends Task {
  owner_id: number;
}

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string | null;
}
