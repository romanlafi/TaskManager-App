import { useState } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import TaskCard from '../TaskCard/TaskCard';
import Button from '../ui/Button/Button';
import { STATUS_OPTIONS } from './taskViewUtils';
import type { Task, TaskStatus } from '../../types';

interface TaskBoardProps {
  tasks: Task[];
  busyIds: Set<number>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onCreate: (status: TaskStatus) => void;
}

export default function TaskBoard({ tasks, busyIds, onEdit, onDelete, onStatusChange, onCreate }: TaskBoardProps) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [target, setTarget] = useState<TaskStatus | null>(null);
  return (
    <div className="grid min-w-[840px] grid-cols-3 items-start gap-5 pb-4">
      {STATUS_OPTIONS.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.value);
        return (
          <section
            key={column.value}
            aria-label={column.label}
            onDragOver={(e) => {
              if (draggedId !== null) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setTarget(column.value);
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setTarget(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const task = tasks.find((item) => item.id === draggedId);
              if (task && task.status !== column.value) onStatusChange(task, column.value);
              setDraggedId(null);
              setTarget(null);
            }}
            className={`min-h-64 rounded-xl border p-3 transition-colors ${target === column.value ? 'border-accent bg-accent/10' : 'border-divider bg-surface/30'}`}
          >
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <span className={`size-2 rounded-full ${column.dot}`} />
                {column.label}
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-content/50">{columnTasks.length}</span>
              </h2>
              <Button
                variant="icon"
                size="s"
                icon={Plus}
                onClick={() => onCreate(column.value)}
                aria-label={`Add task to ${column.label}`}
              />
            </div>
            <div className="flex flex-col gap-3">
              {columnTasks.map((task) => (
                <div key={task.id} className={draggedId === task.id ? 'opacity-40' : ''}>
                  <div
                    draggable={!busyIds.has(task.id)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(task.id));
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setTarget(null);
                    }}
                    title="Drag to another column, or use the status selector"
                    className="flex cursor-grab items-center gap-1 px-1 py-1 text-xs text-content/35 active:cursor-grabbing"
                  >
                    <GripVertical size={14} aria-hidden="true" />
                    <span>Move task</span>
                  </div>
                  <TaskCard
                    {...task}
                    disabled={busyIds.has(task.id)}
                    onEdit={() => onEdit(task)}
                    onDelete={() => onDelete(task)}
                    onStatusChange={(status) => onStatusChange(task, status)}
                  />
                </div>
              ))}
              {columnTasks.length === 0 && (
                <p className="rounded-lg border border-dashed border-divider p-6 text-center text-sm text-content/40">
                  No tasks here yet
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
