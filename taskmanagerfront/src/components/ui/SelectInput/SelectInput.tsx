import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
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
      <select
        {...props}
        id={selectId}
        className={`${getFieldClassName(size, variant)} cursor-pointer ${className}`}
      >
        {children ?? options.map(({ value, label: optionLabel }) => (
          <option key={value} value={value}>{optionLabel}</option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;
