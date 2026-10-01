export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
}
