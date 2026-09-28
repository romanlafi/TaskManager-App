import { useEffect, useState } from 'react';
import styles from './Toast.module.css';
import type { ToastType } from '../../../types';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

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

  return (
    <div className={`${styles.toast} ${styles[type]} ${visible ? styles.show : styles.hide}`}>
      <div className={styles.content}>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
