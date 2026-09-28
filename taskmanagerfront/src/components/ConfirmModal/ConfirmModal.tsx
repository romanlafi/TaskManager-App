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
  isOpen, onConfirm, onCancel,
  title = 'Confirm', message = 'Are you sure?',
  confirmText = 'Confirm', cancelText = 'Cancel',
  confirmVariant = 'danger', icon = null,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      <div className="bg-surface text-content p-6 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] w-[70%] max-w-[380px] text-center animate-[modal-in_0.25s_ease-out]">
        {icon && <div className="flex justify-center items-center mb-4">{icon}</div>}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm opacity-80">{message}</p>
        <div className="mt-6 flex justify-between gap-4">
          <Button onClick={onCancel} variant="outline">{cancelText}</Button>
          <Button onClick={onConfirm} variant={confirmVariant}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
