import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import logo from '../../assets/new_logo_text.webp';
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
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
  };

  const resetForm = () => {
    setIsLogin(true);
    setPassword('');
  };

  const changeMode = (login: boolean) => {
    if (submitting || login === isLogin) return;
    setIsLogin(login);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!username.trim() || !password) {
      e.currentTarget.reportValidity();
      return;
    }
    setSubmitting(true);
    const showError = (message: string) => showToast(message, 'error');
    const registrationComplete = () => {
      resetForm();
      showToast(MESSAGES.REGISTER_SUCCESS, 'success');
    };
    try {
      const action = isLogin ? loginUser : registerUser;
      const { status, data } = await action(username.trim(), password);

      const handlers: Record<number, () => void> = {
        [HTTP_STATUS.SUCCESS]: () => {
          if (isLogin) {
            if (typeof data.access_token !== 'string' || !data.access_token) {
              showError(MESSAGES.UNEXPECTED_ERROR);
              return;
            }
            localStorage.setItem('access_token', data.access_token);
            showToast(MESSAGES.LOGIN_SUCCESS, 'success');
            navigate('/dashboard');
          } else {
            registrationComplete();
          }
        },
        [HTTP_STATUS.CREATED]: registrationComplete,
        [HTTP_STATUS.BAD_REQUEST]: () => showError(data.detail ?? MESSAGES.LOGIN_ERROR),
        [HTTP_STATUS.UNAUTHORIZED]: () => showError(data.detail ?? MESSAGES.LOGIN_ERROR),
        [HTTP_STATUS.NOT_FOUND]: () => showError(data.detail ?? 'User not found.'),
        [HTTP_STATUS.CONFLICT]: () => showError(MESSAGES.REGISTER_CONFLICT),
      };

      (handlers[status] ?? (() => showError(MESSAGES.UNEXPECTED_ERROR)))();
    } catch (err) {
      console.error(err);
      showError(MESSAGES.SERVER_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg p-8 text-content max-sm:p-4">
      <section
        aria-labelledby="auth-heading"
        className="w-full max-w-[420px] rounded-xl border border-divider bg-surface/30 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.2)] max-sm:p-6"
      >
        <h1 id="auth-heading" className="sr-only">
          {isLogin ? 'Log in to TaskManager' : 'Create a TaskManager account'}
        </h1>
        <img src={logo} alt="TaskManager" className="mx-auto mb-6 h-56 w-full object-contain" />
        <form onSubmit={handleSubmit} aria-busy={submitting}>
          <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-5">
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              pattern={'.*\\S.*'}
              className="h-11 py-0"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              label="Password"
              name="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              className="h-11 py-0"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              className="h-11 [&_span]:text-sm"
              text={submitting ? (isLogin ? 'Logging in...' : 'Creating account...') : isLogin ? 'Log In' : 'Register'}
              icon={isLogin ? LogIn : UserPlus}
            />
          </fieldset>
        </form>
        <button
          type="button"
          disabled={submitting}
          onClick={() => changeMode(!isLogin)}
          className="group mt-6 w-full cursor-pointer rounded-sm text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"
        >
          <span className="text-content/50">{isLogin ? "Don't have an account? " : 'Already have an account? '}</span>
          <span className="text-accent transition-colors group-hover:text-content group-hover:underline">
            {isLogin ? 'Register here.' : 'Log in here.'}
          </span>
        </button>
      </section>
    </main>
  );
};

export default AuthForm;
