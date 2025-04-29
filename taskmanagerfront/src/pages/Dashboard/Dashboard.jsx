import styles from './Dashboard.module.css';
import React, { useEffect, useState } from 'react';
import {useNavigate} from "react-router-dom";
import {createTask, deleteTask, fetchTasks, updateTask} from "../../services/taskService.js";
import TaskCard from "../../components/TaskCard/TaskCard.jsx";
import FilterPanel from "../../components/FilterPanel/FilterPanel.jsx";
import TaskModal from "../../components/TaskModal/TaskModal.jsx";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.jsx";
import { HTTP_STATUS } from "../../config/api.js";
import {MESSAGES} from "../../config/messages.js";
import warningIcon from "../../assets/icons/warning.svg";


const Dashboard = ({setToastMessage, setToastType}) => {
    const [tasks, setTasks] = useState([]);

    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState('created_at');
    const [status, setStatus] = useState('');
    const [beforeDeadline, setBeforeDeadline] = useState('');
    const [limit, setLimit] = useState(10);

    const [tempOrderBy, setTempOrderBy] = useState(orderBy);
    const [tempStatus, setTempStatus] = useState(status);
    const [tempBeforeDeadline, setTempBeforeDeadline] = useState(beforeDeadline);
    const [tempLimit, setTempLimit] = useState(limit);

    const [skip, setSkip] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();

    const loadTasks = async () => {
        setLoading(true);
        setError(null);

        try {
            const { status: responseStatus, data } = await fetchTasks(skip, limit, search, orderBy, status, beforeDeadline);
            if (responseStatus === HTTP_STATUS.UNAUTHORIZED) {
                handleLogout();
                showToast(MESSAGES.SESSION_EXPIRED_ERROR);
            }
            if (responseStatus === HTTP_STATUS.SUCCESS) {
                setTasks(data);
            } else {
                setError(data.detail || 'Could not fetch tasks.');
            }
        } catch (error) {
            console.error(error);
            showToast(MESSAGES.SERVER_ERROR, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTask = async (data) => {
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
            console.error('Error saving task:', err);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!taskToDelete) return;

        try {
            await deleteTask(id);
            showToast(MESSAGES.TASK_DELETED, 'success');
            await loadTasks();
        } catch (error) {
            console.error(error);
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

    const showToast = (message, type) => {
        setToastMessage(message);
        setToastType(type);
    };

    const openCreateModal = () => {
        setEditingTask(null);
        setShowModal(true);
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTask(null);
    };

    useEffect(() => {
        loadTasks();
    }, [search, orderBy, status, beforeDeadline, limit]);

    return (
        <div className={styles.wrapper}>
            <aside className={styles.sidebar}>
                <FilterPanel
                    orderBy={tempOrderBy}
                    setOrderBy={setTempOrderBy}
                    limit={tempLimit}
                    setLimit={setTempLimit}
                    status={tempStatus}
                    setStatus={setTempStatus}
                    beforeDeadline={tempBeforeDeadline}
                    setBeforeDeadline={setTempBeforeDeadline}
                    applyFilters={() => {
                        setOrderBy(tempOrderBy);
                        setLimit(tempLimit);
                        setStatus(tempStatus);
                        setBeforeDeadline(tempBeforeDeadline);
                        setSkip(0);
                    }}
                    resetFilters={() => {
                        setTempOrderBy('created_at');
                        setTempLimit(10);
                        setTempStatus('');
                        setTempBeforeDeadline('');

                        setOrderBy('created_at');
                        setLimit(10);
                        setStatus('');
                        setBeforeDeadline('');
                        setSkip(0);
                    }}
                    onCreate={openCreateModal}
                    onLogout={() => setShowLogoutConfirm(true)}
                />
            </aside>

            <main className={styles.main}>
                <header className={styles.header}>
                    <h1>My Tasks</h1>
                    <input
                        className={styles.search}
                        type="text"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </header>

                <section className={styles.taskList}>
                    {loading && <p>Loading...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {!loading && tasks.length === 0 && <p>No tasks found.</p>}
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            {...task}
                            onEdit={() => openEditModal(task)}
                            onDelete={() => {
                                setTaskToDelete(task.id);
                                setShowConfirm(true);
                            }}
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
                onConfirm={() => handleDeleteTask(taskToDelete)}
                onCancel={() => {
                    setShowConfirm(false);
                    setTaskToDelete(null);
                }}
                icon={<img src={warningIcon} alt="Warning"/>}
            />

            <ConfirmModal
                isOpen={showLogoutConfirm}
                title="Logout"
                message="Are you sure you want to log out?"
                confirmText="Log out"
                cancelText="Cancel"
                confirmVariant="danger"
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
