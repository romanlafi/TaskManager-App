import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { FieldLabel, getFieldClassName } from '../fieldStyles';
import type { FieldSize, FieldVariant } from '../fieldStyles';

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  size?: FieldSize;
  variant?: FieldVariant;
  fieldClassName?: string;
}

const DateInput = ({
  id,
  label,
  size = 'm',
  variant = 'default',
  className = '',
  fieldClassName = '',
  ...props
}: DateInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`flex w-full flex-col gap-1.5 ${fieldClassName}`}>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <input
        {...props}
        id={inputId}
        type="date"
        className={`${getFieldClassName(size, variant)} ${className}`}
      />
    </div>
  );
};

export default DateInput;
