import type { ChangeEventHandler } from 'react';

interface CalendarInputProps {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

const CalendarInput = ({ value, onChange, label, required, placeholder }: CalendarInputProps) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-content text-[0.9rem] font-medium">{label}</label>}
    <input
      type="date"
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="px-3 py-2 rounded-lg border border-divider text-content text-[0.95rem] bg-surface transition-colors focus:border-accent focus:outline-none"
    />
  </div>
);

export default CalendarInput;
