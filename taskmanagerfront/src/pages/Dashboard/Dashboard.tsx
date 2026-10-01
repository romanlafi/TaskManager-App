import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  changeTaskStatus,
  createTask,
  deleteTask,
  fetchTasks,
  TaskRequestError,
  updateTask,
} from '../../services/taskService';
import TaskCard from '../../components/TaskCard/TaskCard';
import FilterPanel from '../../components/FilterPanel/FilterPanel';
import TaskModal from '../../components/TaskModal/TaskModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import TaskBoard from '../../components/TaskViews/TaskBoard';
import TaskCalendar from '../../components/TaskViews/TaskCalendar';
import { filterTasks } from '../../components/TaskViews/taskViewUtils';
import type { TaskFilters, TaskOrder } from '../../components/TaskViews/taskViewUtils';
import { MESSAGES } from '../../config/messages';
import { CalendarDays, Columns3, Filter, List, LogOut, Plus, Trash2, TriangleAlert } from 'lucide-react';
import Button from '../../components/ui/Button/Button';
import SelectInput from '../../components/ui/SelectInput/SelectInput';
import type { Task, TaskFormData, TaskStatus, ToastType } from '../../types';

interface DashboardProps {
  setToastMessage: (msg: string) => void;
  setToastType: (type: ToastType) => void;
}

type TaskView = 'list' | 'board' | 'calendar';
const VIEWS = [
  { value: 'list', label: 'List', icon: List },
  { value: 'board', label: 'Board', icon: Columns3 },
  { value: 'calendar', label: 'Calendar', icon: CalendarDays },
] as const;
const DEFAULT_FILTERS: TaskFilters = { search: '', status: '', priority: '', beforeDeadline: '', orderBy: 'priority' };

export default function Dashboard({ setToastMessage, setToastType }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<TaskView>(() => {
    const saved = localStorage.getItem('task-view');
    return saved === 'board' || saved === 'calendar' ? saved : 'list';
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialDeadline, setInitialDeadline] = useState('');
  const [initialStatus, setInitialStatus] = useState<TaskStatus>('pending');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const pendingIds = useRef(new Set<number>());
  const navigate = useNavigate();

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
    showToast(MESSAGES.SESSION_ENDED, 'success');
  };

  const handleError = (err: unknown) => {
    if (err instanceof TaskRequestError && err.status === 401) {
      localStorage.removeItem('access_token');
      navigate('/');
      showToast(MESSAGES.SESSION_EXPIRED_ERROR, 'error');
    } else {
      showToast(MESSAGES.SERVER_ERROR, 'error');
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetchTasks(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setTasks(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof TaskRequestError && err.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/');
          setToastMessage(MESSAGES.SESSION_EXPIRED_ERROR);
          setToastType('error');
        } else {
          setError(true);
          setToastMessage(MESSAGES.SERVER_ERROR);
          setToastType('error');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload, navigate, setToastMessage, setToastType]);

  const openCreateModal = (deadline = '', status: TaskStatus = 'pending') => {
    setEditingTask(null);
    setInitialDeadline(deadline);
    setInitialStatus(status);
    setShowModal(true);
  };

  const openEditModal = (task: Task) => {
    if (pendingIds.current.has(task.id)) return;
    setEditingTask(task);
    setShowModal(true);
  };

  const handleSaveTask = async (data: TaskFormData) => {
    try {
      const saved = editingTask ? await updateTask(editingTask.id, data) : await createTask(data);
      setTasks((current) =>
        editingTask ? current.map((task) => (task.id === saved.id ? saved : task)) : [...current, saved],
      );
      showToast(editingTask ? MESSAGES.TASK_UPDATED : MESSAGES.TASK_CREATED, 'success');
      setShowModal(false);
      setEditingTask(null);
    } catch (err) {
      handleError(err);
    }
  };

  const setBusy = (id: number, busy: boolean) => {
    if (busy) pendingIds.current.add(id);
    else pendingIds.current.delete(id);
    setBusyIds(new Set(pendingIds.current));
  };

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    if (task.status === status || pendingIds.current.has(task.id)) return;
    setBusy(task.id, true);
    try {
      const saved = await changeTaskStatus(task.id, status);
      setTasks((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      showToast(MESSAGES.TASK_UPDATED, 'success');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(task.id, false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || pendingIds.current.has(taskToDelete.id)) return;
    const id = taskToDelete.id;
    setBusy(id, true);
    try {
      await deleteTask(id);
      setTasks((current) => current.filter((task) => task.id !== id));
      setTaskToDelete(null);
      showToast(MESSAGES.TASK_DELETED, 'success');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(id, false);
    }
  };

  const visibleTasks = filterTasks(tasks, filters);
  const activeFilters = [filters.search.trim(), filters.status, filters.priority, filters.beforeDeadline].filter(
    Boolean,
  ).length;
  const hasFilters = activeFilters > 0;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-content font-[Urbanist,sans-serif]">
      <header className="shrink-0 border-b border-divider bg-surface/30 px-8 py-3 max-md:px-4">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 max-lg:grid-cols-2 max-lg:gap-3">
          <nav
            aria-label="Task views"
            className="flex h-11 w-fit shrink-0 items-center gap-1 rounded-lg border border-divider bg-bg p-1"
          >
            {VIEWS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                aria-pressed={view === value}
                title={label}
                onClick={() => {
                  setView(value);
                  localStorage.setItem('task-view', value);
                }}
                className={
                  'flex h-full cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent max-sm:w-11 max-sm:px-0 ' +
                  (view === value
                    ? 'bg-surface text-content shadow-sm'
                    : 'text-content/45 hover:bg-surface/50 hover:text-content')
                }
              >
                <Icon size={20} aria-hidden="true" />
                <span className="max-sm:sr-only">{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-3 max-lg:order-3 max-lg:col-span-2">
            <div className="relative shrink-0">
              <Button
                variant="icon"
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                aria-controls="task-filters"
                aria-label={'Filters' + (activeFilters ? ' (' + activeFilters + ' active)' : '')}
                title="Search and filters"
                className={`!size-11 ${activeFilters || showFilters ? 'bg-accent/20 text-content' : 'text-content/50'}`}
              />
              {activeFilters > 0 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white"
                >
                  {activeFilters}
                </span>
              )}
            </div>
            <SelectInput
              aria-label="Sort tasks"
              fieldClassName="!w-auto max-lg:flex-1"
              className="h-11 py-0 text-sm"
              value={filters.orderBy}
              onChange={(e) => setFilters({ ...filters, orderBy: e.target.value as TaskOrder })}
              options={[
                { value: 'priority', label: 'Priority: high first' },
                { value: 'created_at', label: 'Newest first' },
                { value: 'title', label: 'Title: A to Z' },
                { value: 'deadline', label: 'Deadline: earliest first' },
              ]}
            />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 max-sm:gap-2">
            <div>
              <Button
                size="m"
                className="h-11 [&_span]:text-sm max-sm:w-11 max-sm:px-0 max-sm:[&_span]:sr-only"
                icon={Plus}
                text="Add Task"
                title="Add Task"
                onClick={() => openCreateModal()}
                disabled={loading || error}
              />
            </div>
            <div className="flex h-11 items-center border-l border-divider pl-3 max-sm:pl-2">
              <Button
                variant="icon"
                size="m"
                className="!size-11"
                icon={LogOut}
                aria-label="Log out"
                title="Log out"
                onClick={() => setShowLogoutConfirm(true)}
              />
            </div>
          </div>
        </div>

        {showFilters && (
          <div
            id="task-filters"
            className="mt-3 max-h-[60dvh] overflow-y-auto rounded-xl border border-divider bg-bg p-4"
          >
            <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
          </div>
        )}
        {activeFilters > 0 && !showFilters && (
          <button
            className="mt-2 cursor-pointer text-xs text-accent hover:text-content"
            onClick={() => setShowFilters(true)}
          >
            {activeFilters} active {activeFilters === 1 ? 'filter' : 'filters'} · Show search and filters
          </button>
        )}
      </header>

      <main
        aria-label="Tasks"
        aria-busy={loading}
        className="min-h-0 flex-1 overflow-auto px-8 py-6 max-md:px-4 max-md:py-4"
      >
        {loading && (
          <p role="status" className="py-12 text-center text-sm text-content/50">
            Loading your tasks...
          </p>
        )}
        {error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Button variant="minimal" text="Reload tasks" onClick={() => setReload((value) => value + 1)} />
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-content/45">
              <p aria-live="polite">
                {visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}
                {hasFilters ? ' matching your filters' : ''}
              </p>
              {view === 'board' && <p>Drag the handle to move tasks, or use their status selector.</p>}
              {view === 'calendar' && <p>Deadlines at a glance · Select a task to edit.</p>}
            </div>
            {hasFilters && visibleTasks.length === 0 && (
              <div className="mb-5 rounded-xl border border-dashed border-divider p-8 text-center">
                <p className="mb-3 text-sm text-content/50">No tasks match your search or filters.</p>
                <Button variant="minimal" text="Clear search and filters" onClick={() => setFilters(DEFAULT_FILTERS)} />
              </div>
            )}
            {view === 'list' && (
              <section aria-label="Task list" className="flex flex-col gap-3">
                {!hasFilters && visibleTasks.length === 0 && (
                  <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-divider py-16 text-center">
                    <List size={32} className="text-accent" aria-hidden="true" />
                    <div>
                      <h2 className="font-semibold">A fresh start</h2>
                      <p className="mt-1 text-sm text-content/50">Add your first task and take it from there.</p>
                    </div>
                    <Button variant="minimal" icon={Plus} text="Add a task" onClick={() => openCreateModal()} />
                  </div>
                )}
                {visibleTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    disabled={busyIds.has(task.id)}
                    onEdit={() => openEditModal(task)}
                    onDelete={() => setTaskToDelete(task)}
                    onStatusChange={(status) => handleStatusChange(task, status)}
                  />
                ))}
              </section>
            )}
            {view === 'board' && (
              <TaskBoard
                tasks={visibleTasks}
                busyIds={busyIds}
                onEdit={openEditModal}
                onDelete={setTaskToDelete}
                onStatusChange={handleStatusChange}
                onCreate={(status) => openCreateModal('', status)}
              />
            )}
            {view === 'calendar' && (
              <TaskCalendar
                tasks={visibleTasks}
                busyIds={busyIds}
                onEdit={openEditModal}
                onCreate={(deadline) => openCreateModal(deadline)}
              />
            )}
          </>
        )}
      </main>

      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={'Delete "' + (taskToDelete?.title ?? '') + '"?'}
        confirmText={taskToDelete && busyIds.has(taskToDelete.id) ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        busy={!!taskToDelete && busyIds.has(taskToDelete.id)}
        confirmButtonIcon={Trash2}
        onConfirm={handleDeleteTask}
        onCancel={() => setTaskToDelete(null)}
        icon={<TriangleAlert size={32} />}
      />
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmText="Log out"
        cancelText="Cancel"
        confirmButtonIcon={LogOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <TaskModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialData={editingTask}
        initialDeadline={initialDeadline}
        initialStatus={initialStatus}
      />
    </div>
  );
}
