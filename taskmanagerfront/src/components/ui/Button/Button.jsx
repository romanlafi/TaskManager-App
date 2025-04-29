import styles from './Button.module.css';

const Button = ({ children, className = '', variant = 'default', ...props }) => {
    const baseClass = styles.button;

    const variantClasses = variant
        .split(' ')
        .map((v) => styles[v] || '')
        .join(' ');

    return (
        <button className={`${baseClass} ${variantClasses} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
