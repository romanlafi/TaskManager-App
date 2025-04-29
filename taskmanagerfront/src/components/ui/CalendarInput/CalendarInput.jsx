import styles from './CalendarInput.module.css';

const CalendarInput = ({ value, onChange, label }) => {
    return (
        <div className={styles.wrapper}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                type="date"
                value={value}
                onChange={onChange}
                className={styles.input}
            />
        </div>
    );
};

export default CalendarInput;
