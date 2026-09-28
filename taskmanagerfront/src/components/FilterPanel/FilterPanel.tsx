import styles from './FilterPanel.module.css';
import Button from '../ui/Button/Button';
import CalendarInput from '../ui/CalendarInput/CalendarInput';
import SelectInput from '../ui/SelectInput/SelectInput';

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
  orderBy, setOrderBy,
  limit, setLimit,
  status, setStatus,
  beforeDeadline, setBeforeDeadline,
  applyFilters, resetFilters,
  onCreate, onLogout,
}: FilterPanelProps) => {
  return (
    <div className={styles.panel}>
      <h2>Filters</h2>

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

      <CalendarInput
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

      <div className={styles.buttonGroup}>
        <Button variant="outline" onClick={resetFilters}>Reset</Button>
        <Button onClick={applyFilters}>Apply</Button>
      </div>

      <Button onClick={onCreate}>Add Task</Button>
      <Button onClick={onLogout}>Log out</Button>
    </div>
  );
};

export default FilterPanel;
