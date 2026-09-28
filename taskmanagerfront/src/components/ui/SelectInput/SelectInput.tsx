import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  className?: string;
}

const SelectInput = ({ label, value, onChange, options = [], className = '', ...props }: SelectInputProps) => (
  <div className={`flex flex-col gap-1 w-full ${className}`}>
    {label && <label className="text-[0.9rem] text-content font-medium">{label}</label>}
    <select
      className="px-3 py-2.5 rounded-lg border border-divider bg-surface text-content text-[0.95rem] transition-colors focus:outline-none focus:border-accent"
      value={value}
      onChange={onChange}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default SelectInput;
