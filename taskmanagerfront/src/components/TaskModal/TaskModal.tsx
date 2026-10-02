import { useState, useLayoutEffect, useRef } from 'react';
import Button from '../ui/Button/Button';
import DateInput from '../ui/DateInput/DateInput';
import SelectInput from '../ui/SelectInput/SelectInput';
import Textarea from '../ui/Textarea/Textarea';
import { Input } from '../ui/Input/Input';
import { Save, X } from 'lucide-react';
import type { Task, TaskFormData, TaskStatus, TaskPriority } from '../../types';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../TaskViews/taskViewUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
  initialData?: Task | null;
  initialDeadline?: string;
  initialStatus?: TaskStatus;
}

const TaskModal = ({
  isOpen,
  ...props
}: TaskModalProps) => isOpen ? <TaskEditor {...props} /> : null;

const TaskEditor = ({
  onClose,
  onSave,
  initialData = null,
  initialDeadline = '',
  initialStatus = 'pending',
}: Omit<TaskModalProps, 'isOpen'>) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [deadline, setDeadline] = useState(initialData?.deadline?.slice(0, 10) ?? initialDeadline);
  const [status, setStatus] = useState<TaskStatus>(initialData?.status ?? initialStatus);
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority ?? 'medium');
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !title.trim()) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description, deadline, status, priority });
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="task-modal-heading"
      onKeyDown={(e) => {
        if (e.key !== 'Tab') return;
        const controls = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>('input, textarea, select, button'),
        ).filter((element) => !element.matches(':disabled') && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-[640px] overflow-hidden rounded-xl border border-divider bg-bg p-0 text-content shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop:bg-black/60"
    >
      <form onSubmit={handleSubmit}>
        <fieldset disabled={saving} className="flex max-h-[calc(90dvh-2px)] min-w-0 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-divider bg-surface/30 px-6 py-4 max-sm:px-4">
            <h2 id="task-modal-heading" className="text-lg font-semibold">
              {initialData?.id ? 'Edit Task' : 'New Task'}
            </h2>
            <Button variant="icon" icon={X} className="!size-11" onClick={onClose} aria-label="Close task editor" />
          </header>
          <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-6 max-sm:p-4">
            <Input
              label="Title"
              placeholder="Write a short title"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="h-11 py-0"
            />
            <Textarea
              label="Description"
              placeholder="Add some details (optional)"
              value={description}
              maxLength={1000}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="min-h-24"
            />
            <div className="grid grid-cols-3 items-end gap-4 max-sm:grid-cols-2">
              <SelectInput
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                options={STATUS_OPTIONS}
                className="h-11 py-0"
              />
              <SelectInput
                label="Priority"
                value={priority}
                options={PRIORITY_OPTIONS}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-11 py-0"
              />
              <DateInput
                label="Deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-11 py-0"
                fieldClassName="max-sm:col-span-2"
              />
            </div>
          </div>
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-divider bg-surface/30 px-6 py-4 max-sm:px-4">
            <div>
              <Button variant="secondary" onClick={onClose} text="Cancel" className="h-11 [&_span]:text-sm" />
            </div>
            <div>
              <Button
                type="submit"
                icon={Save}
                text={saving ? 'Saving...' : 'Save'}
                className="h-11 min-w-24 [&_span]:text-sm"
              />
            </div>
          </footer>
        </fieldset>
      </form>
    </dialog>
  );
};

export default TaskModal;
