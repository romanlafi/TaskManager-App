import React from 'react';
import styles from './ConfirmModal.module.css';
import Button from "../ui/Button/Button.jsx";

const ConfirmModal = ({
                          isOpen,
                          onConfirm,
                          onCancel,
                          title = "Confirm",
                          message = "Are you sure?",
                          confirmText = "Confirm",
                          cancelText = "Cancel",
                          confirmVariant = "danger",
                          icon = null
                      }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {icon && <div className={styles.icon}>{icon}</div>}
                <h3>{title}</h3>
                <p>{message}</p>
                <div className={styles.actions}>
                    <Button onClick={onCancel} variant="outline">{cancelText}</Button>
                    <Button onClick={onConfirm} variant={confirmVariant}>{confirmText}</Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
