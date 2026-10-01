import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Button from '../ui/Button/Button';
import { calendarDays, dateKey, PRIORITY_STYLE, STATUS_OPTIONS } from './taskViewUtils';
import type { Task } from '../../types';

interface TaskCalendarProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onCreate: (deadline: string) => void;
  busyIds: Set<number>;
}

export default function TaskCalendar({ tasks, onEdit, onCreate, busyIds }: TaskCalendarProps) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const days = calendarDays(month);
  const today = dateKey(new Date());
  const unscheduled = tasks.filter((task) => !task.deadline);
  const dated = new Map<string, Task[]>();
  tasks.forEach((task) => {
    if (task.deadline) {
      const key = task.deadline.slice(0, 10);
      dated.set(key, [...(dated.get(key) ?? []), task]);
    }
  });

  const taskButton = (task: Task) => (
    <button
      key={task.id}
      onClick={() => onEdit(task)}
      disabled={busyIds.has(task.id)}
      title={`${task.title} · ${task.priority} priority · ${STATUS_OPTIONS.find((item) => item.value === task.status)?.label}`}
      className={`flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-white/10 focus-visible:outline-accent disabled:opacity-50 ${PRIORITY_STYLE[task.priority]}`}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${STATUS_OPTIONS.find((item) => item.value === task.status)?.dot}`}
      />
      <span className={`truncate ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>{task.title}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="minimal"
            size="s"
            text="Today"
            onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
          />
          <Button
            variant="icon"
            size="s"
            icon={ChevronLeft}
            aria-label="Previous month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          />
          <Button
            variant="icon"
            size="s"
            icon={ChevronRight}
            aria-label="Next month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-divider">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b border-divider bg-surface/60">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="px-3 py-3 text-xs font-semibold text-content/50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = dateKey(day);
              const outside = day.getMonth() !== month.getMonth();
              return (
                <section
                  key={key}
                  aria-label={day.toLocaleDateString(undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  className={`min-h-28 min-w-0 border-r border-b border-divider p-2 ${outside ? 'bg-bg text-content/35' : 'bg-surface/20'}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      aria-current={key === today ? 'date' : undefined}
                      className={`flex size-7 items-center justify-center rounded-full text-xs ${key === today ? 'bg-accent font-bold text-white' : ''}`}
                    >
                      {day.getDate()}
                    </span>
                    <Button
                      variant="icon"
                      size="s"
                      icon={Plus}
                      aria-label={`Add task due ${key}`}
                      onClick={() => onCreate(key)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">{(dated.get(key) ?? []).map(taskButton)}</div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
      {unscheduled.length > 0 && (
        <section aria-label="Tasks without a deadline" className="rounded-xl border border-divider p-4">
          <h3 className="mb-3 text-sm font-semibold text-content/60">
            No deadline <span className="ml-1 text-content/40">{unscheduled.length}</span>
          </h3>
          <div className="grid grid-cols-3 gap-2 max-md:grid-cols-2 max-sm:grid-cols-1">
            {unscheduled.map(taskButton)}
          </div>
        </section>
      )}
    </div>
  );
}
