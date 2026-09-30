import Button from '../ui/Button/Button';
import DateInput from '../ui/DateInput/DateInput';
import SelectInput from '../ui/SelectInput/SelectInput';
import { ListFilter, LogOut, Plus, RotateCcw } from 'lucide-react';

interface FilterPanelProps {
  orderBy: string;
  setOrderBy: (v: string) => void;
  limit: number;
  setLimit: (v: number) => void;
  status: string;
  setStatus: (v: string) => void;
  beforeDeadline: string;
  setBeforeDeadline: (v: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  onCreate: () => void;
  onLogout: () => void;
}

const FilterPanel = ({
  orderBy, setOrderBy, limit, setLimit, status, setStatus,
  beforeDeadline, setBeforeDeadline, applyFilters, resetFilters, onCreate, onLogout,
}: FilterPanelProps) => (
  <div className="flex flex-col gap-4 text-[0.95rem] text-content">
    <h2 className="text-lg font-semibold">Filters</h2>

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

    <div className="flex gap-2 justify-between mt-4">
      <Button variant="outline" onClick={resetFilters} icon={RotateCcw} text="Reset" size="s" />
      <Button onClick={applyFilters} icon={ListFilter} text="Apply" size="s" />
    </div>

    <Button onClick={onCreate} icon={Plus} text="Add Task" />
    <Button onClick={onLogout} variant="ghost" icon={LogOut} text="Log out" />
  </div>
);

export default FilterPanel;
