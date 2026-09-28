import styles from './TaskCard.module.css';
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
    case 'pending': return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'done': return 'Completed';
  }
};

const TaskCard = ({ title, description, status, deadline, created_at, onEdit, onDelete }: TaskCardProps) => {
  return (
    <div className={`${styles.card} ${styles[status]}`}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <span className={styles.status}>{getStatusLabel(status)}</span>
      </div>

      <p className={styles.description}>{description}</p>

      <div className={styles.meta}>
        <span><strong>Created:</strong> {formatDate(created_at)}</span>
        {deadline && <span><strong>Deadline:</strong> {formatDate(deadline)}</span>}
      </div>

      {(onEdit || onDelete) && (
        <div className={styles.iconActions}>
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
};

export default TaskCard;
