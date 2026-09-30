import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { FieldLabel, getFieldClassName } from '../fieldStyles';
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
}: TextareaProps) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className={`flex w-full flex-col gap-1.5 ${fieldClassName}`}>
      {label && <FieldLabel htmlFor={textareaId}>{label}</FieldLabel>}
      <textarea
        {...props}
        id={textareaId}
        className={`${getFieldClassName(size, variant)} resize-y ${className}`}
      />
    </div>
  );
};

export default Textarea;
