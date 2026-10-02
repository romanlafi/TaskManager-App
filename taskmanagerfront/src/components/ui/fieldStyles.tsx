import { useId } from 'react';
import type { ReactNode } from 'react';

export type FieldSize = 's' | 'm' | 'l';
export type FieldVariant = 'default' | 'filled';

const SIZES: Record<FieldSize, string> = {
  s: 'min-h-8 px-3 py-1.5 text-sm',
  m: 'min-h-11 px-3 py-2.5 text-[0.95rem]',
  l: 'min-h-13 px-4 py-3 text-base',
};

const VARIANTS: Record<FieldVariant, string> = {
  default: 'border-divider bg-surface',
  filled: 'border-transparent bg-[#343230]',
};

export const getFieldClassName = (size: FieldSize, variant: FieldVariant) =>
  `w-full box-border rounded-lg border text-content placeholder:text-white/45 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]}`;

export const FieldLabel = ({ htmlFor, children }: { htmlFor: string; children: ReactNode }) => (
  <label htmlFor={htmlFor} className="text-[0.9rem] font-medium text-content">{children}</label>
);

interface FieldWrapperProps {
  id?: string;
  label?: string;
  fieldClassName?: string;
  children: (id: string) => ReactNode;
}

export const FieldWrapper = ({ id, label, fieldClassName = '', children }: FieldWrapperProps) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className={`flex w-full flex-col gap-1.5 ${fieldClassName}`}>
      {label && <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>}
      {children(fieldId)}
    </div>
  );
};
