import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus } from 'lucide-react';
import Toast from '../../taskmanagerfront/src/components/ui/Toast/Toast';
import Button from '../../taskmanagerfront/src/components/ui/Button/Button';
import { Input } from '../../taskmanagerfront/src/components/ui/Input/Input';
import DateInput from '../../taskmanagerfront/src/components/ui/DateInput/DateInput';
import Textarea from '../../taskmanagerfront/src/components/ui/Textarea/Textarea';
import SelectInput from '../../taskmanagerfront/src/components/ui/SelectInput/SelectInput';
import TaskCard from '../../taskmanagerfront/src/components/TaskCard/TaskCard';
import ConfirmModal from '../../taskmanagerfront/src/components/ConfirmModal/ConfirmModal';

afterEach(() => vi.useRealTimers());

describe('toast lifecycle', () => {
  it('animates out before closing after three seconds', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="Saved" onClose={onClose} />);
    act(() => vi.advanceTimersByTime(2600));
    expect(screen.getByText('Saved').parentElement?.className).toContain('toast-out');
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(400));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancels timers when removed', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { unmount } = render(<Toast message="Failed" type="error" onClose={onClose} />);
    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(onClose).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('buttons and fields', () => {
  it('forwards button actions and respects disabled state', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<Button text="Add" icon={Plus} onClick={onClick} size="l" />);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    rerender(<Button text="Add" onClick={onClick} disabled size="s" />);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('associates labels with unique fields and preserves native attributes', () => {
    render(<>
      <Input label="Password" type="password" required />
      <Input label="New password" type="password" autoComplete="new-password" id="new-password" />
      <Input aria-label="Search" size="s" variant="filled" />
      <Textarea label="Notes" id="notes" size="l" maxLength={1000} />
      <DateInput label="Due" id="due" disabled />
      <DateInput aria-label="Other date" />
      <SelectInput label="Choice" id="choice"><option value="custom">Custom child</option></SelectInput>
      <SelectInput aria-label="Empty choice" />
      <Textarea aria-label="Unlabelled notes" />
    </>);
    expect(screen.getByLabelText('Password')).toBeRequired();
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByLabelText('New password')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText('Password').id).not.toBe(screen.getByLabelText('New password').id);
    expect(screen.getByLabelText('Notes')).toHaveAttribute('maxlength', '1000');
    expect(screen.getByLabelText('Due')).toBeDisabled();
    expect(screen.getByLabelText('Due')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('Choice')).toHaveValue('custom');
    expect(screen.getByLabelText('Empty choice').children).toHaveLength(0);
  });
});

describe('task cards and confirmation', () => {
  it.each(['pending', 'in_progress', 'done'] as const)('renders %s with priority and no deadline', (status) => {
    render(<TaskCard id={1} title="Task" description="Details" priority="medium" status={status} created_at="2026-09-01" deadline={null} onEdit={vi.fn()} onDelete={vi.fn()} onStatusChange={vi.fn()} />);
    expect(screen.getByLabelText('Status for Task')).toHaveValue(status);
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
  });

  it('forwards editing, deletion and status changes and disables busy cards', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onStatusChange = vi.fn();
    const props = { id: 1, title: 'Task', description: '', priority: 'high' as const, status: 'pending' as const, created_at: '2026-09-01', deadline: '2020-10-01', onEdit, onDelete, onStatusChange };
    const { rerender } = render(<TaskCard {...props} />);
    await user.click(screen.getByRole('button', { name: 'Edit Task' }));
    await user.click(screen.getByRole('button', { name: 'Task', exact: true }));
    expect(onEdit).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Delete Task' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    await user.selectOptions(screen.getByLabelText('Status for Task'), 'done');
    expect(onStatusChange).toHaveBeenCalledWith('done');
    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
    rerender(<TaskCard {...props} disabled status="done" />);
    expect(screen.getByLabelText('Status for Task')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit Task' })).toBeDisabled();
    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
  });

  it('renders confirmation defaults only when open and forwards decisions', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(<ConfirmModal isOpen={false} onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    rerender(<ConfirmModal isOpen onConfirm={onConfirm} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
