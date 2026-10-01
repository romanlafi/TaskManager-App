import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TaskBoard from '../../taskmanagerfront/src/components/TaskViews/TaskBoard';
import TaskCalendar from '../../taskmanagerfront/src/components/TaskViews/TaskCalendar';
import TaskModal from '../../taskmanagerfront/src/components/TaskModal/TaskModal';
import { dateKey } from '../../taskmanagerfront/src/components/TaskViews/taskViewUtils';
import type { Task } from '../../taskmanagerfront/src/types';

const task: Task = { id: 1, title: 'Release', description: '', priority: 'high', status: 'pending', deadline: null, created_at: '2026-10-01' };

describe('board interactions', () => {
  it('groups cards and forwards creation, edit, delete and keyboard status changes', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn(), onDelete = vi.fn(), onCreate = vi.fn(), onStatusChange = vi.fn();
    const props = { tasks: [task], busyIds: new Set<number>(), onEdit, onDelete, onCreate, onStatusChange };
    const { rerender } = render(<TaskBoard {...props} />);
    expect(within(screen.getByRole('region', { name: 'Pending' })).getByRole('button', { name: task.title, exact: true })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add task to In progress' }));
    expect(onCreate).toHaveBeenCalledWith('in_progress');
    await user.click(screen.getByRole('button', { name: 'Edit Release' }));
    await user.click(screen.getByRole('button', { name: 'Delete Release' }));
    expect(onEdit).toHaveBeenCalledWith(task);
    expect(onDelete).toHaveBeenCalledWith(task);
    await user.selectOptions(screen.getByLabelText('Status for Release'), 'done');
    expect(onStatusChange).toHaveBeenCalledWith(task, 'done');
    rerender(<TaskBoard {...props} busyIds={new Set([1])} />);
    expect(screen.getByTitle('Drag to another column, or use the status selector')).toHaveAttribute('draggable', 'false');
    expect(screen.getByLabelText('Status for Release')).toBeDisabled();
  });

  it('moves a dragged task once, ignores unchanged or unrelated drops, and clears drag feedback', () => {
    const onStatusChange = vi.fn();
    render(<TaskBoard tasks={[task]} busyIds={new Set()} onEdit={vi.fn()} onDelete={vi.fn()} onCreate={vi.fn()} onStatusChange={onStatusChange} />);
    const handle = screen.getByTitle('Drag to another column, or use the status selector');
    const pending = screen.getByRole('region', { name: 'Pending' });
    const done = screen.getByRole('region', { name: 'Completed' });
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' };
    fireEvent.dragOver(done, { dataTransfer });
    fireEvent.drop(done, { dataTransfer });
    expect(onStatusChange).not.toHaveBeenCalled();
    fireEvent.dragStart(handle, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', '1');
    fireEvent.dragOver(done, { dataTransfer });
    expect(done.className).toContain('border-accent');
    const internalLeave = new Event('dragleave', { bubbles: true });
    Object.defineProperty(internalLeave, 'relatedTarget', { value: done.firstChild });
    fireEvent(done, internalLeave);
    expect(done.className).toContain('border-accent');
    fireEvent.dragLeave(done, { relatedTarget: null });
    expect(done.className).toContain('border-divider');
    fireEvent.dragOver(done, { dataTransfer });
    fireEvent.drop(done, { dataTransfer });
    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith(task, 'done');
    fireEvent.dragStart(handle, { dataTransfer });
    fireEvent.drop(pending, { dataTransfer });
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    fireEvent.dragStart(handle, { dataTransfer });
    fireEvent.dragOver(done, { dataTransfer });
    fireEvent.dragEnd(handle);
    expect(done.className).toContain('border-divider');
  });
});

describe('calendar interactions', () => {
  it('places dated and undated tasks, navigates months, and creates tasks on a chosen day', async () => {
    const user = userEvent.setup();
    const today = dateKey(new Date());
    const dated = { ...task, id: 2, title: 'Completed release', status: 'done' as const, deadline: today };
    const another = { ...task, id: 3, title: 'Review', status: 'in_progress' as const, deadline: today };
    const onEdit = vi.fn(), onCreate = vi.fn();
    const { rerender } = render(<TaskCalendar tasks={[task, dated, another]} onEdit={onEdit} onCreate={onCreate} busyIds={new Set([3])} />);
    expect(within(screen.getByRole('region', { name: 'Tasks without a deadline' })).getByRole('button', { name: 'Release' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Completed release' }));
    expect(onEdit).toHaveBeenCalledWith(dated);
    await user.click(screen.getByRole('button', { name: 'Release', exact: true }));
    expect(onEdit).toHaveBeenCalledWith(task);
    await user.click(screen.getByRole('button', { name: 'Add task due ' + today }));
    expect(onCreate).toHaveBeenCalledWith(today);
    const month = screen.getByRole('heading', { level: 2 }).textContent;
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).not.toBe(month);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(month!);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(month!);
    rerender(<TaskCalendar tasks={[]} onEdit={onEdit} onCreate={onCreate} busyIds={new Set()} />);
    expect(screen.queryByRole('region', { name: 'Tasks without a deadline' })).not.toBeInTheDocument();
  });
});

describe('native task editor', () => {
  it('uses initial creation values, trims titles, and blocks cancellation while saving', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    let complete!: () => void;
    const onSave = vi.fn().mockImplementation(() => new Promise<void>((resolve) => { complete = resolve; }));
    const { rerender } = render(<TaskModal isOpen onClose={onClose} onSave={onSave} initialDeadline="2026-10-02" initialStatus="done" />);
    const dialog = screen.getByRole('dialog');
    expect(screen.getByLabelText('Status')).toHaveValue('done');
    expect(screen.getByLabelText('Deadline')).toHaveValue('2026-10-02');
    await user.type(screen.getByLabelText('Title'), '   ');
    fireEvent.submit(screen.getByLabelText('Title').closest('form')!);
    expect(onSave).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Title'), ' Release ');
    await user.selectOptions(screen.getByLabelText('Priority'), 'low');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ title: 'Release', description: '', status: 'done', priority: 'low', deadline: '2026-10-02' });
    fireEvent.submit(screen.getByLabelText('Title').closest('form')!);
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => complete());
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Close task editor' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    rerender(<TaskModal isOpen={false} onClose={onClose} onSave={onSave} />);
    expect(dialog).not.toHaveAttribute('open');
  });

  it('keeps tab navigation inside the editor', () => {
    render(<TaskModal isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>('input, textarea, select, button'));
    controls.forEach((element) => vi.spyOn(element, 'getClientRects').mockReturnValue([{ width: 1 }] as unknown as DOMRectList));
    controls[0].focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(controls.at(-1)).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(controls[0]).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    controls.forEach((element) => vi.spyOn(element, 'getClientRects').mockReturnValue([] as unknown as DOMRectList));
    expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(false);
  });
});
