import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ type = 'text', ...props }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const passwordType = showPassword ? 'text' : 'password';
  const inputType = isPassword ? passwordType : type;

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={inputType}
        className={`w-full box-border py-3 pl-3 border border-[#ddd] rounded-xl bg-[#f5f5f5] text-[#333] transition-colors placeholder:text-[#aaa] placeholder:text-base focus:outline-none focus:border-[#8d745b] focus:shadow-[0_0_0_2px_#76614b] ${isPassword ? 'pr-10' : 'pr-3'} ${inputType === 'password' ? 'text-xl tracking-[0.15em]' : 'text-base'}`}
        autoComplete={isPassword ? 'current-password' : undefined}
      />
      {isPassword && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#333] p-0 flex items-center"
          onClick={() => setShowPassword(!showPassword)}
          aria-label="Toggle password visibility"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};
