import type { TaskStatus } from '@taskmanager/types';
export type { TaskStatus };

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  JWT_ISSUER?: string;
}

export interface UserRow {
  id: number;
  username: string;
  hashed_password: string;
  is_active: number;
  role: string;
}

export interface TaskRow {
  id: number;
  title: string;
  description: string;
  created_at: string;
  status: TaskStatus;
  deadline: string | null;
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
  deadline?: string | null;
}
