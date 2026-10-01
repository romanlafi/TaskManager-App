import type { Task, TaskPriority, TaskStatus } from '../../types';

export const STATUS_OPTIONS: { value: TaskStatus; label: string; dot: string }[] = [
  { value: 'pending', label: 'Pending', dot: 'bg-amber-300' },
  { value: 'in_progress', label: 'In progress', dot: 'bg-sky-300' },
  { value: 'done', label: 'Completed', dot: 'bg-emerald-300' },
];

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const PRIORITY_STYLE: Record<TaskPriority, string> = {
  high: 'bg-rose-400/10 text-rose-300',
  medium: 'bg-amber-300/10 text-amber-200',
  low: 'bg-sky-300/10 text-sky-200',
};

export type TaskOrder = 'priority' | 'created_at' | 'title' | 'deadline';

export interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  beforeDeadline: string;
  orderBy: TaskOrder;
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = filters.search.trim().toLocaleLowerCase();
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return tasks
    .filter(
      (task) =>
        (!query || `${task.title} ${task.description}`.toLocaleLowerCase().includes(query)) &&
        (!filters.status || task.status === filters.status) &&
        (!filters.priority || task.priority === filters.priority) &&
        (!filters.beforeDeadline || (!!task.deadline && task.deadline.slice(0, 10) <= filters.beforeDeadline)),
    )
    .sort((a, b) => {
      let compared = 0;
      if (filters.orderBy === 'priority') compared = priorityRank[a.priority] - priorityRank[b.priority];
      if (filters.orderBy === 'title') compared = a.title.localeCompare(b.title);
      if (filters.orderBy === 'deadline') compared = (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999');
      if (filters.orderBy === 'created_at') compared = b.created_at.localeCompare(a.created_at);
      return compared || b.id - a.id;
    });
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calendarDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), 1 - offset + index));
}
