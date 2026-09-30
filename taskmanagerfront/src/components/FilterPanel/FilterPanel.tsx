import Button from '../ui/Button/Button';
import DateInput from '../ui/DateInput/DateInput';
import SelectInput from '../ui/SelectInput/SelectInput';
import { LogOut, Plus, RotateCcw } from 'lucide-react';

interface FilterPanelProps {
  orderBy: string;
  setOrderBy: (v: string) => void;
  limit: number;
  setLimit: (v: number) => void;
  status: string;
  setStatus: (v: string) => void;
  beforeDeadline: string;
  setBeforeDeadline: (v: string) => void;
  resetFilters: () => void;
  onCreate: () => void;
  onLogout: () => void;
}

const FilterPanel = ({
  orderBy, setOrderBy, limit, setLimit, status, setStatus,
  beforeDeadline, setBeforeDeadline, resetFilters, onCreate, onLogout,
}: FilterPanelProps) => (
  <div className="flex h-full flex-col gap-4 text-[0.95rem] text-content">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Filters</h2>
      <Button variant="minimal" onClick={resetFilters} icon={RotateCcw} text="Reset"/>
    </div>

    <SelectInput
      label="Order by"
      value={orderBy}
      onChange={(e) => setOrderBy(e.target.value)}
      options={[
        { value: 'created_at', label: 'Created at' },
        { value: 'title', label: 'Title' },
        { value: 'status', label: 'Status' },
        { value: 'deadline', label: 'Deadline' },
      ]}
    />

    <SelectInput
      label="Status"
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      options={[
        { value: '', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'done', label: 'Completed' },
      ]}
    />

    <DateInput
      label="Before deadline"
      value={beforeDeadline}
      onChange={(e) => setBeforeDeadline(e.target.value)}
    />

    <SelectInput
      label="Limit"
      value={limit}
      onChange={(e) => setLimit(Number(e.target.value))}
      options={[
        { value: 5, label: '5' },
        { value: 10, label: '10' },
        { value: 25, label: '25' },
        { value: 50, label: '50' },
      ]}
    />

    <Button onClick={onCreate} icon={Plus} text="Add Task" />
    <Button onClick={onLogout} variant="secondary" icon={LogOut} text="Log out" className="mt-auto" />
  </div>
);

export default FilterPanel;
