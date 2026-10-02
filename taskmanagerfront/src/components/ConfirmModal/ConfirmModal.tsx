import Button from '../ui/Button/Button';
import type { ButtonVariant } from '../ui/Button/Button';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useLayoutEffect, useId, useRef } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonVariant;
  confirmButtonIcon?: LucideIcon;
  icon?: ReactNode;
  busy?: boolean;
}

const ConfirmModal = ({
  isOpen, ...props
}: ConfirmModalProps) => isOpen ? <ConfirmDialog {...props} /> : null;

const ConfirmDialog = ({
  onConfirm, onCancel,
  title = 'Confirm', message = 'Are you sure?',
  confirmText = 'Confirm', cancelText = 'Cancel',
  confirmVariant = 'danger', confirmButtonIcon, icon = null, busy = false,
}: Omit<ConfirmModalProps, 'isOpen'>) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const messageId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby={headingId} aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto border-0 bg-surface text-content p-6 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] w-[70%] max-w-[380px] text-center animate-[modal-in_0.25s_ease-out] backdrop:bg-black/60">
        {icon && <div className="flex justify-center items-center mb-4">{icon}</div>}
        <h3 id={headingId} className="text-lg font-semibold mb-2">{title}</h3>
        <p id={messageId} className="text-sm opacity-80">{message}</p>
        <div className="mt-6 flex justify-between gap-4">
          <Button onClick={onCancel} disabled={busy} variant="secondary" text={cancelText} />
          <Button onClick={onConfirm} disabled={busy} variant={confirmVariant} icon={confirmButtonIcon} text={confirmText} />
        </div>
    </dialog>
  );
};

export default ConfirmModal;
