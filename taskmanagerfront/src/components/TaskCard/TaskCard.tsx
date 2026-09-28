import Button from '../ui/Button/Button';
import { Pencil, Trash2 } from 'lucide-react';
import type { TaskStatus } from '../../types';

interface TaskCardProps {
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string | null;
  created_at: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

const getStatusLabel = (status: TaskStatus) => {
  switch (status) {
    case 'pending':     return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'done':        return 'Completed';
  }
};

const statusBadge: Record<TaskStatus, string> = {
  pending:     'bg-[#ffb300] text-[#1f1f1f]',
  in_progress: 'bg-[#42a5f5] text-[#1f1f1f]',
  done:        'bg-[#66bb6a] text-[#1f1f1f]',
};

const TaskCard = ({ title, description, status, deadline, created_at, onEdit, onDelete }: TaskCardProps) => (
  <div className="bg-surface text-content p-4 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.15)] flex flex-col gap-2 transition-transform duration-200 relative hover:scale-[1.01]">
    <div className="flex justify-between items-center">
      <h3 className="font-semibold text-base">{title}</h3>
      <span className={`text-[0.85rem] px-2 py-0.5 rounded-lg font-medium capitalize ${statusBadge[status]}`}>
        {getStatusLabel(status)}
      </span>
    </div>

    <p className="text-[0.95rem] leading-[1.4]">{description}</p>

    <div className="flex gap-4 text-[0.8rem] opacity-80 mt-2">
      <span><strong>Created:</strong> {formatDate(created_at)}</span>
      {deadline && <span><strong>Deadline:</strong> {formatDate(deadline)}</span>}
    </div>

    {(onEdit || onDelete) && (
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 items-end">
        {onDelete && (
          <Button variant="icon danger" onClick={onDelete} title="Delete Task">
            <Trash2 size={16} />
          </Button>
        )}
        {onEdit && (
          <Button variant="icon" onClick={onEdit} title="Edit Task">
            <Pencil size={16} />
          </Button>
        )}
      </div>
    )}
  </div>
);

export default TaskCard;
