import styles from './TaskCard.module.css';
import Button from "../ui/Button/Button.jsx";
import editIcon from '../../assets/icons/edit.svg';
import deleteIcon from '../../assets/icons/delete.svg';

const TaskCard = ({ title, description, status, deadline, created_at, onEdit, onDelete }) => {
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'in_progress': return 'In Progress';
            case 'done': return 'Completed';
            default: return 'Unknown';
        }
    };

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
                        <Button
                            variant="icon danger"
                            onClick={onDelete}
                            title="Delete Task"
                        >
                            <img src={deleteIcon} alt="Delete" />
                        </Button>
                    )}
                    {onEdit && (
                        <Button
                            variant="icon"
                            onClick={onEdit}
                            title="Edit Task"
                        >
                            <img src={editIcon} alt="Edit" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskCard;
