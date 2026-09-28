import styles from './CalendarInput.module.css';
import type { ChangeEventHandler } from 'react';

interface CalendarInputProps {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

const CalendarInput = ({ value, onChange, label, required, placeholder }: CalendarInputProps) => {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type="date"
        value={value}
        onChange={onChange}
        className={styles.input}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
};

export default CalendarInput;
