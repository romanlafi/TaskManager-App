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

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export function formatDeadline(deadline: string): string {
  return new Date(deadline.slice(0, 10) + 'T00:00:00').toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = filters.search.trim().toLocaleLowerCase();
  return tasks
    .filter(
      (task) =>
        (!query || `${task.title} ${task.description}`.toLocaleLowerCase().includes(query)) &&
        (!filters.status || task.status === filters.status) &&
        (!filters.priority || task.priority === filters.priority) &&
        (!filters.beforeDeadline || (!!task.deadline && task.deadline.slice(0, 10) <= filters.beforeDeadline)),
    )
    .sort((first, second) => {
      let compared = 0;
      if (filters.orderBy === 'priority') compared = PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority];
      if (filters.orderBy === 'title') compared = first.title.localeCompare(second.title);
      if (filters.orderBy === 'deadline') compared = (first.deadline ?? '9999').localeCompare(second.deadline ?? '9999');
      if (filters.orderBy === 'created_at') compared = second.created_at.localeCompare(first.created_at);
      return compared || second.id - first.id;
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
