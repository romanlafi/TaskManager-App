import React, { useState, useEffect } from 'react';
import styles from './TaskModal.module.css';
import Button from '../ui/Button/Button';
import CalendarInput from '../ui/CalendarInput/CalendarInput';
import SelectInput from "../ui/SelectInput/SelectInput.jsx";

const TaskModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [status, setStatus] = useState('pending');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setDescription(initialData.description || '');
                setStatus(initialData.status || 'pending');

                if (initialData.deadline) {
                    const formattedDate = new Date(initialData.deadline).toISOString().split('T')[0];
                    setDeadline(formattedDate);
                } else {
                    setDeadline('');
                }
            }
        } else {
            setTitle('');
            setDescription('');
            setDeadline('');
            setStatus('pending');
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ title, description, deadline, status });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>{initialData?.id ? 'Edit Task' : 'New Task'}</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                    />
                    <CalendarInput
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        placeholder="Deadline"
                    />

                    {initialData?.id && (
                        <SelectInput
                            label="Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            options={[
                                { value: 'pending', label: 'Pending' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'done', label: 'Completed' },
                            ]}
                        />
                    )}

                    <div className={styles.actions}>
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
