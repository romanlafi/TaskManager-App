import type { TextareaHTMLAttributes } from 'react';
import { FieldWrapper, getFieldClassName } from '../fieldStyles';
import type { FieldSize, FieldVariant } from '../fieldStyles';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  size?: FieldSize;
  variant?: FieldVariant;
  fieldClassName?: string;
}

const Textarea = ({
  id,
  label,
  size = 'm',
  variant = 'default',
  className = '',
  fieldClassName = '',
  ...props
}: TextareaProps) => (
  <FieldWrapper id={id} label={label} fieldClassName={fieldClassName}>
    {(fieldId) => (
      <textarea
        {...props}
        id={fieldId}
        className={`${getFieldClassName(size, variant)} resize-y ${className}`}
      />
    )}
  </FieldWrapper>
);

export default Textarea;
