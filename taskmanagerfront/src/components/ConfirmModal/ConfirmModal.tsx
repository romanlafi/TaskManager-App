import styles from './ConfirmModal.module.css';
import Button from '../ui/Button/Button';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: string;
  icon?: ReactNode;
}

const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  icon = null,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={styles.actions}>
          <Button onClick={onCancel} variant="outline">{cancelText}</Button>
          <Button onClick={onConfirm} variant={confirmVariant}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
