import styles from './Button.module.css';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  className?: string;
}

const Button = ({ children, className = '', variant = 'default', ...props }: ButtonProps) => {
  const variantClasses = variant
    .split(' ')
    .map((v) => styles[v] ?? '')
    .join(' ');

  return (
    <button className={`${styles.button} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
