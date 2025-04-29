import styles from './SelectInput.module.css';

const SelectInput = ({ label, value, onChange, options = [], className = '', ...props }) => {
    return (
        <div className={`${styles.wrapper} ${className}`}>
            {label && <label className={styles.label}>{label}</label>}
            <select
                className={styles.select}
                value={value}
                onChange={onChange}
                {...props}
            >
                {options.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SelectInput;
