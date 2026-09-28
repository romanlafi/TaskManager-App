import { useState } from 'react';
import styles from './Input.module.css';
import { Eye, EyeOff } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ type = 'text', ...props }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const passwordType = showPassword ? 'text' : 'password';
  const inputType = isPassword ? passwordType : type;

  return (
    <div className={styles.wrapper}>
      <input
        {...props}
        type={inputType}
        className={styles.input}
        autoComplete={isPassword ? 'current-password' : undefined}
      />
      {isPassword && (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setShowPassword(!showPassword)}
          aria-label="Toggle password visibility"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
};
