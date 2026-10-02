import { useEffect, useState } from 'react';
import type { ToastType } from '../../../types';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const typeClass: Record<ToastType, string> = {
  success: 'bg-[#4caf50]',
  error: 'bg-[#e53935]',
};

const Toast = ({ message, type = 'success', onClose }: ToastProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => setVisible(false), 2600);
    const timer2 = setTimeout(() => onClose(), 3000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onClose]);

  const animClass = visible ? 'animate-[toast-in_0.4s_ease_forwards]' : 'animate-[toast-out_0.4s_ease_forwards]';

  return (
    <output
      role={type === 'error' ? 'alert' : undefined}
      aria-atomic="true"
      className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.35)] text-content text-[0.9rem] font-medium max-w-[300px] w-fit min-h-[42px] backdrop-blur-md inline-flex items-center gap-3 leading-snug break-words transition-transform hover:scale-[1.02] ${typeClass[type]} ${animClass}`}
    >
      <span>{message}</span>
    </output>
  );
};

export default Toast;
