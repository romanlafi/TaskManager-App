import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  className?: string;
}

const BASE = 'w-full px-4 py-3 bg-accent text-content font-semibold text-base border-none rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/75 hover:scale-[1.02]';

const getVariantClass = (variant: string): string => {
  if (variant === 'icon danger') {
    return 'bg-transparent border-none p-1 w-7 h-7 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-[#b00020] rounded';
  }
  const map: Record<string, string> = {
    default: '',
    danger: 'bg-[#b00020] text-white hover:bg-[#c63a3a]',
    outline: 'bg-transparent border border-accent text-accent hover:bg-accent/10',
    icon: 'bg-transparent border-none p-1 w-7 h-7 flex items-center justify-center transition-all duration-200 hover:scale-110',
  };
  return variant.split(' ').map(v => map[v] ?? '').join(' ');
};

const Button = ({ children, className = '', variant = 'default', ...props }: ButtonProps) => (
  <button className={`${BASE} ${getVariantClass(variant)} ${className}`} {...props}>
    {children}
  </button>
);

export default Button;
