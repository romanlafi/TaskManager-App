import type { InputHTMLAttributes } from 'react';
import { FieldWrapper, getFieldClassName } from '../fieldStyles';
import type { FieldSize, FieldVariant } from '../fieldStyles';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  size?: FieldSize;
  variant?: FieldVariant;
  fieldClassName?: string;
}

export const Input = ({
  id,
  label,
  type = 'text',
  size = 'm',
  variant = 'default',
  className = '',
  fieldClassName = '',
  autoComplete,
  ...props
}: InputProps) => (
  <FieldWrapper id={id} label={label} fieldClassName={fieldClassName}>
    {(fieldId) => (
      <input
        {...props}
        id={fieldId}
        type={type}
        autoComplete={autoComplete ?? (type === 'password' ? 'current-password' : undefined)}
        className={`${getFieldClassName(size, variant)} ${className}`}
      />
    )}
  </FieldWrapper>
);
