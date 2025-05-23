import styles from './CalendarInput.module.css';

const CalendarInput = ({ value, onChange, label, required }) => {
    return (
        <div className={styles.wrapper}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                type="date"
                value={value}
                onChange={onChange}
                className={styles.input}
                required={required}
            />
        </div>
    );
};

export default CalendarInput;
