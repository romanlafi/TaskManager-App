import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { FieldLabel, getFieldClassName } from '../fieldStyles';
import type { FieldSize, FieldVariant } from '../fieldStyles';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectInputProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options?: SelectOption[];
  size?: FieldSize;
  variant?: FieldVariant;
  fieldClassName?: string;
}

const SelectInput = ({
  id,
  label,
  options = [],
  size = 'm',
  variant = 'default',
  className = '',
  fieldClassName = '',
  children,
  ...props
}: SelectInputProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={`flex w-full flex-col gap-1.5 ${fieldClassName}`}>
      {label && <FieldLabel htmlFor={selectId}>{label}</FieldLabel>}
      <div className="group relative">
        <select
          {...props}
          id={selectId}
          className={`${getFieldClassName(size, variant)} cursor-pointer appearance-none [color-scheme:dark] hover:border-accent/50 ${size === 's' ? 'pr-8' : 'pr-10'} ${className}`}
        >
          {children ??
            options.map(({ value, label: optionLabel }) => (
              <option key={value} value={value}>
                {optionLabel}
              </option>
            ))}
        </select>
        <ChevronDown
          size={{ s: 14, l: 18, m: 16 }[size]}
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-content/45 transition-colors group-focus-within:text-accent ${size === 's' ? 'right-2.5' : 'right-3'} ${props.disabled ? 'opacity-50' : ''}`}
        />
      </div>
    </div>
  );
};

export default SelectInput;
