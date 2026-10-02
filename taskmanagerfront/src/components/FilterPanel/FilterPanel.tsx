import Button from '../ui/Button/Button';
import DateInput from '../ui/DateInput/DateInput';
import SelectInput from '../ui/SelectInput/SelectInput';
import { RotateCcw, Search } from 'lucide-react';
import { Input } from '../ui/Input/Input';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../TaskViews/taskViewUtils';
import type { TaskFilters } from '../TaskViews/taskViewUtils';

interface FilterPanelProps {
  readonly filters: TaskFilters;
  readonly onChange: (filters: TaskFilters) => void;
  readonly onReset: () => void;
}

export default function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  return (
    <div className="grid grid-cols-4 items-end gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
      <div className="relative col-span-full">
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3.5 left-3 text-content/40"
        />
        <Input
          label="Search tasks"
          type="search"
          placeholder="Search by title or description..."
          value={filters.search}
          className="h-11 py-0 pl-10"
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <SelectInput
        label="Status"
        className="h-11 py-0"
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]}
      />
      <SelectInput
        label="Priority"
        className="h-11 py-0"
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        options={[{ value: '', label: 'All priorities' }, ...PRIORITY_OPTIONS]}
      />
      <DateInput
        label="Due on or before"
        className="h-11 py-0"
        value={filters.beforeDeadline}
        onChange={(e) => onChange({ ...filters, beforeDeadline: e.target.value })}
      />
      <Button variant="ghost" icon={RotateCcw} text="Reset filters" className="h-11" onClick={onReset} />
    </div>
  );
}
