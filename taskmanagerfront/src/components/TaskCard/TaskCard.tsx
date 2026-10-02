import Button from '../ui/Button/Button';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import SelectInput from '../ui/SelectInput/SelectInput';
import type { Task, TaskStatus } from '../../types';
import { dateKey, formatDeadline, PRIORITY_OPTIONS, PRIORITY_STYLE, STATUS_OPTIONS } from '../TaskViews/taskViewUtils';

interface TaskCardProps extends Task {
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onStatusChange: (status: TaskStatus) => void;
  readonly disabled?: boolean;
}

export default function TaskCard({
  title,
  description,
  status,
  priority,
  deadline,
  onEdit,
  onDelete,
  onStatusChange,
  disabled,
}: TaskCardProps) {
  const overdue = deadline && deadline.slice(0, 10) < dateKey(new Date()) && status !== 'done';
  return (
    <article
      className={
        'flex flex-col gap-3 rounded-xl border border-divider bg-surface p-4 transition-colors hover:border-accent/60 ' +
        (disabled ? 'opacity-60' : '')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onEdit}
          disabled={disabled}
          className="min-w-0 cursor-pointer text-left font-semibold break-words hover:text-accent focus-visible:outline-accent"
        >
          {title}
        </button>
        <span className={'shrink-0 rounded-md px-2 py-1 text-xs font-medium ' + PRIORITY_STYLE[priority]}>
          {PRIORITY_OPTIONS.find((o) => o.value === priority)?.label}
        </span>
      </div>
      {description && <p className="line-clamp-2 text-sm leading-relaxed text-content/60 break-words">{description}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-3">
        <SelectInput
          aria-label={'Status for ' + title}
          value={status}
          disabled={disabled}
          size="s"
          fieldClassName="!w-auto max-w-full"
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          className="h-8 rounded-md !bg-bg py-0 pl-2 text-xs"
          options={STATUS_OPTIONS}
        />
        <div className="flex items-center gap-1">
          <Button
            variant="icon"
            icon={Pencil}
            size="s"
            onClick={onEdit}
            disabled={disabled}
            aria-label={'Edit ' + title}
          />
          <Button
            variant="icon-danger"
            icon={Trash2}
            size="s"
            onClick={onDelete}
            disabled={disabled}
            aria-label={'Delete ' + title}
          />
        </div>
      </div>
      {deadline && (
        <span className={'flex items-center gap-1.5 text-xs ' + (overdue ? 'text-rose-300' : 'text-content/50')}>
          <CalendarDays size={14} aria-hidden="true" />
          {formatDeadline(deadline)}
          {overdue && ' · Overdue'}
        </span>
      )}
    </article>
  );
}
