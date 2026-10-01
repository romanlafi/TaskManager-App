import { describe, expect, it } from 'vitest';
import { calendarDays, dateKey, filterTasks } from '../taskmanagerfront/src/components/TaskViews/taskViewUtils';
import type { TaskFilters } from '../taskmanagerfront/src/components/TaskViews/taskViewUtils';
import type { Task } from '../packages/types/src';

const defaults: TaskFilters = { search: '', status: '', priority: '', beforeDeadline: '', orderBy: 'priority' };
const tasks: Task[] = [
  {
    id: 1,
    title: 'Plan release',
    description: 'Review notes',
    priority: 'low',
    status: 'pending',
    deadline: null,
    created_at: '2026-09-01',
  },
  {
    id: 2,
    title: 'Fix login',
    description: 'Session expiry',
    priority: 'high',
    status: 'in_progress',
    deadline: '2026-10-01',
    created_at: '2026-09-02',
  },
  {
    id: 3,
    title: 'Write docs',
    description: 'Release notes',
    priority: 'medium',
    status: 'done',
    deadline: '2026-10-02',
    created_at: '2026-09-03',
  },
];

describe('Shared task views', () => {
  it('orders high, medium, low without changing the source tasks', () => {
    expect(filterTasks(tasks, defaults).map((task) => task.id)).toEqual([2, 3, 1]);
    expect(tasks.map((task) => task.id)).toEqual([1, 2, 3]);
  });

  it('combines title/description search with status and priority filters', () => {
    expect(
      filterTasks(tasks, { ...defaults, search: '  RELEASE ', status: 'done', priority: 'medium' }).map(
        (task) => task.id,
      ),
    ).toEqual([3]);
  });

  it('includes the selected deadline and excludes undated tasks', () => {
    expect(filterTasks(tasks, { ...defaults, beforeDeadline: '2026-10-01' }).map((task) => task.id)).toEqual([2]);
  });

  it('puts undated tasks last when sorting by deadline', () => {
    expect(filterTasks(tasks, { ...defaults, orderBy: 'deadline' }).map((task) => task.id)).toEqual([2, 3, 1]);
  });

  it('builds a Monday-first leap-year month including surrounding days', () => {
    const days = calendarDays(new Date(2024, 1, 1));
    expect(days).toHaveLength(42);
    expect(days[0].getDay()).toBe(1);
    expect(dateKey(days[0])).toBe('2024-01-29');
    expect(days.map(dateKey)).toContain('2024-02-29');
    expect(new Set(days.map(dateKey)).size).toBe(42);
  });

  it('handles a Sunday month start and a year boundary', () => {
    const days = calendarDays(new Date(2023, 0, 1));
    expect(dateKey(days[0])).toBe('2022-12-26');
    expect(dateKey(days[6])).toBe('2023-01-01');
    expect(dateKey(days[41])).toBe('2023-02-05');
  });
});
