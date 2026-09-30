import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTask, deleteTask, fetchTasks, updateTask } from '../../services/taskService';
import TaskCard from '../../components/TaskCard/TaskCard';
import FilterPanel from '../../components/FilterPanel/FilterPanel';
import TaskModal from '../../components/TaskModal/TaskModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { HTTP_STATUS } from '../../config/api';
import { MESSAGES } from '../../config/messages';
import { Filter, LogOut, Trash2, TriangleAlert } from 'lucide-react';
import { Input } from '../../components/ui/Input/Input';
import type { Task, TaskFormData, ToastType } from '../../types';

interface DashboardProps {
  setToastMessage: (msg: string) => void;
  setToastType: (type: ToastType) => void;
}

const Dashboard = ({ setToastMessage, setToastType }: DashboardProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('created_at');
  const [status, setStatus] = useState('');
  const [beforeDeadline, setBeforeDeadline] = useState('');
  const [limit, setLimit] = useState(10);
  const [skip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const navigate = useNavigate();

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
  };

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status: responseStatus, data } = await fetchTasks(skip, limit, search, orderBy, status, beforeDeadline);
      if (responseStatus === HTTP_STATUS.UNAUTHORIZED) {
        handleLogout();
        showToast(MESSAGES.SESSION_EXPIRED_ERROR, 'error');
        return;
      }
      if (responseStatus === HTTP_STATUS.SUCCESS) {
        setTasks(data);
      } else {
        setError('Could not fetch tasks.');
      }
    } catch (err) {
      console.error(err);
      showToast(MESSAGES.SERVER_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (data: TaskFormData) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data.title, data.description, data.status, data.deadline);
        showToast(MESSAGES.TASK_UPDATED, 'success');
      } else {
        await createTask(data.title, data.description, data.deadline);
        showToast(MESSAGES.TASK_CREATED, 'success');
      }
      await loadTasks();
      closeModal();
    } catch (err) {
      showToast(MESSAGES.SERVER_ERROR, 'error');
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!taskToDelete) return;
    try {
      await deleteTask(id);
      showToast(MESSAGES.TASK_DELETED, 'success');
      await loadTasks();
    } catch (err) {
      console.error(err);
      showToast(MESSAGES.UNEXPECTED_ERROR, 'error');
    } finally {
      setShowConfirm(false);
      setTaskToDelete(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
    showToast(MESSAGES.SESSION_ENDED, 'success');
  };

  const openCreateModal = () => { setEditingTask(null); setShowModal(true); };
  const openEditModal = (task: Task) => { setEditingTask(task); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingTask(null); };

  useEffect(() => { loadTasks(); }, [search, orderBy, status, beforeDeadline, limit]);

  return (
    <div className="flex h-screen bg-bg text-content font-[Urbanist,sans-serif]">
      {/* Mobile filter toggle */}
      <button
        className="hidden max-md:flex fixed bottom-4 left-4 z-[1001] w-12 h-12 rounded-full bg-accent text-white border-none shadow-[0_4px_10px_rgba(0,0,0,0.3)] justify-center items-center transition-colors hover:bg-accent/80 cursor-pointer"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        aria-label="Toggle filters"
      >
        <Filter size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`w-[280px] bg-surface border-r border-divider p-8 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.1)] max-md:fixed max-md:top-0 max-md:h-screen max-md:z-[1000] max-md:w-[60%] max-md:transition-[left] max-md:duration-300 max-md:shadow-[2px_0_10px_rgba(0,0,0,0.3)] ${showMobileFilters ? 'max-md:left-0' : 'max-md:left-[-100%]'}`}
        onClick={() => setShowMobileFilters(false)}
        onKeyDown={(e) => e.key === 'Escape' && setShowMobileFilters(false)}
      >
        <FilterPanel
          orderBy={orderBy} setOrderBy={setOrderBy}
          limit={limit} setLimit={setLimit}
          status={status} setStatus={setStatus}
          beforeDeadline={beforeDeadline} setBeforeDeadline={setBeforeDeadline}
          resetFilters={() => { setOrderBy('created_at'); setLimit(10); setStatus(''); setBeforeDeadline(''); }}
          onCreate={openCreateModal}
          onLogout={() => setShowLogoutConfirm(true)}
        />
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto max-md:p-4">
        <header className="flex justify-between items-center">
          <h1 className="shrink-0 text-2xl font-bold">My Tasks</h1>
          <Input
            fieldClassName="ml-auto max-w-[300px] max-md:max-w-[180px]"
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </header>

        <section className="flex flex-col gap-4">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && tasks.length === 0 && <p>No tasks found.</p>}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              {...task}
              onEdit={() => openEditModal(task)}
              onDelete={() => { setTaskToDelete(task.id); setShowConfirm(true); }}
            />
          ))}
        </section>
      </main>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonIcon={Trash2}
        onConfirm={() => handleDeleteTask(taskToDelete!)}
        onCancel={() => { setShowConfirm(false); setTaskToDelete(null); }}
        icon={<TriangleAlert size={32} />}
      />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmText="Log out"
        cancelText="Cancel"
        confirmVariant="danger"
        confirmButtonIcon={LogOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <TaskModal
        isOpen={showModal}
        onClose={closeModal}
        onSave={handleSaveTask}
        initialData={editingTask}
      />
    </div>
  );
};

export default Dashboard;
