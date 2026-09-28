import { useState } from 'react';
import styles from './Input.module.css';
import eye from '../../../assets/icons/eye.svg';
import eyeOff from '../../../assets/icons/eyeOff.svg';
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
          <img
            src={showPassword ? eyeOff : eye}
            alt="Toggle password"
            className={styles.icon}
          />
        </button>
      )}
    </div>
  );
};
