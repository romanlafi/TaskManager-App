import { useState, useEffect } from 'react';
import Button from '../ui/Button/Button';
import DateInput from '../ui/DateInput/DateInput';
import SelectInput from '../ui/SelectInput/SelectInput';
import Textarea from '../ui/Textarea/Textarea';
import { Input } from '../ui/Input/Input';
import { Save } from 'lucide-react';
import type { Task, TaskFormData, TaskStatus } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  initialData?: Task | null;
}

const TaskModal = ({ isOpen, onClose, onSave, initialData = null }: TaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setStatus(initialData.status);
        setDeadline(
          initialData.deadline
            ? new Date(initialData.deadline).toISOString().split('T')[0]
            : '',
        );
      }
    } else {
      setTitle('');
      setDescription('');
      setDeadline('');
      setStatus('pending');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({ title, description, deadline, status });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      <div className="bg-surface text-content p-8 rounded-2xl max-w-[500px] w-[70%] shadow-[0_6px_30px_rgba(0,0,0,0.3)]">
        <h2 className="mb-4 text-xl font-semibold">{initialData?.id ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Title"
            placeholder="Write a short title"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            placeholder="Add some details (optional)"
            value={description}
            maxLength={1000}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <DateInput
            label="Deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          {initialData?.id && (
            <SelectInput
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'done', label: 'Completed' },
              ]}
            />
          )}
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onClose} text="Cancel" />
            <Button type="submit" icon={Save} text="Save" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
