export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type ToastType = 'success' | 'error';

export interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  status: TaskStatus;
  deadline: string | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
}
