import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/new_logo_text.png';
import { loginUser, registerUser } from '../../services/authService';
import Button from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { HTTP_STATUS } from '../../config/api';
import { MESSAGES } from '../../config/messages';
import type { ToastType } from '../../types';

interface AuthFormProps {
  setToastMessage: (msg: string) => void;
  setToastType: (type: ToastType) => void;
}

const AuthForm = ({ setToastMessage, setToastType }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
  };

  const resetForm = () => {
    setIsLogin(true);
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const action = isLogin ? loginUser : registerUser;
      const { status, data } = await action(username, password);

      const handlers: Record<number, () => void> = {
        [HTTP_STATUS.SUCCESS]: () => {
          if (isLogin) {
            localStorage.setItem('access_token', data.access_token);
            showToast(MESSAGES.LOGIN_SUCCESS, 'success');
            navigate('/dashboard');
          } else {
            showToast(MESSAGES.REGISTER_SUCCESS, 'success');
            resetForm();
          }
        },
        [HTTP_STATUS.CREATED]: () => { showToast(MESSAGES.REGISTER_SUCCESS, 'success'); resetForm(); },
        [HTTP_STATUS.BAD_REQUEST]: () => showToast(data.detail ?? MESSAGES.LOGIN_ERROR, 'error'),
        [HTTP_STATUS.UNAUTHORIZED]: () => showToast(data.detail ?? MESSAGES.LOGIN_ERROR, 'error'),
        [HTTP_STATUS.NOT_FOUND]: () => showToast(data.detail ?? 'User not found.', 'error'),
        [HTTP_STATUS.CONFLICT]: () => showToast(MESSAGES.REGISTER_CONFLICT, 'error'),
      };

      (handlers[status] ?? (() => showToast(MESSAGES.UNEXPECTED_ERROR, 'error')))();
    } catch (err) {
      console.error(err);
      showToast(MESSAGES.SERVER_ERROR, 'error');
    }
  };

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-8 box-border overflow-y-auto">
      <div className="max-w-[400px] w-full bg-surface p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-transform duration-200 max-h-full overflow-y-auto hover:scale-[1.02] max-sm:p-6 max-sm:max-w-full">
        <img src={logo} alt="TaskManager" className="mx-auto mb-4 h-60 w-full object-contain" />

        <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-4 w-full max-sm:gap-3">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit">
            {isLogin ? 'Log In' : 'Register'}
          </Button>
        </form>

        <button
          type="button"
          className="bg-transparent border-none p-0 w-full text-center mt-6 text-sm text-[#a08060] cursor-pointer transition-opacity hover:underline hover:opacity-80 max-sm:text-[13px]"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Don't have an account? Register here."
            : 'Already have an account? Log in here.'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
