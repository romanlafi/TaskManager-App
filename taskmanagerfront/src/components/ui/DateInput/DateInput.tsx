import type { InputHTMLAttributes } from 'react';
import { FieldWrapper, getFieldClassName } from '../fieldStyles';
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
}: DateInputProps) => (
  <FieldWrapper id={id} label={label} fieldClassName={fieldClassName}>
    {(fieldId) => (
      <input
        {...props}
        id={fieldId}
        type="date"
        className={`date-input-native ${getFieldClassName(size, variant)} ${className}`}
      />
    )}
  </FieldWrapper>
);

export default DateInput;
