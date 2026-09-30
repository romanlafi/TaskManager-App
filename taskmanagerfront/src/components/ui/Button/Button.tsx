import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'minimal' | 'icon' | 'icon-danger';
export type ButtonSize = 's' | 'm' | 'l';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: LucideIcon;
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
}

const BASE = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'w-full bg-accent text-content hover:bg-accent/80 active:bg-accent/70',
  secondary: 'w-full bg-[#48433e] text-content hover:bg-[#57514a] active:bg-[#625b53]',
  outline: 'w-full border border-accent bg-transparent text-content hover:bg-accent/10 active:bg-accent/20',
  danger: 'w-full bg-[#b00020] text-white hover:bg-[#c63a3a] active:bg-[#a52d2d]',
  ghost: 'w-full bg-transparent text-content hover:bg-white/5 active:bg-white/10',
  minimal: 'w-auto bg-transparent px-0 text-content hover:text-accent active:text-accent/80',
  icon: 'rounded-lg bg-transparent text-content hover:bg-white/10 active:bg-white/15',
  'icon-danger': 'rounded-lg bg-transparent text-[#ff8a8a] hover:bg-[#b00020]/20 hover:text-[#ffaaaa] active:bg-[#b00020]/30',
};

const SIZES: Record<ButtonSize, { button: string; text: string; icon: number }> = {
  s: { button: 'min-h-8 px-3 text-sm', text: 'text-sm', icon: 16 },
  m: { button: 'min-h-11 px-4 text-base', text: 'text-base', icon: 20 },
  l: { button: 'min-h-13 px-5 text-lg', text: 'text-lg', icon: 24 },
};

const ICON_BUTTON_SIZES: Record<ButtonSize, string> = {
  s: 'size-8',
  m: 'size-10',
  l: 'size-12',
};

const Button = ({
  text,
  icon: Icon,
  size = 'm',
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) => {
  const iconOnly = variant === 'icon' || variant === 'icon-danger';
  const sizeStyles = SIZES[size];

  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${iconOnly ? ICON_BUTTON_SIZES[size] : sizeStyles.button} ${variant === 'minimal' ? 'group rounded-none' : ''} ${className}`}
      type={type}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" size={sizeStyles.icon} className={`shrink-0 ${variant === 'minimal' ? 'transition-transform duration-300 group-hover:-rotate-[360deg] motion-reduce:transition-none' : ''}`} />}
      {text && !iconOnly && <span className={sizeStyles.text}>{text}</span>}
    </button>
  );
};

export default Button;
