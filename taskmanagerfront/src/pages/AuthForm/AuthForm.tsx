import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../../services/authService';
import Button from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { HTTP_STATUS } from '../../config/api';
import { MESSAGES } from '../../config/messages';
import styles from './AuthForm.module.css';
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
        [HTTP_STATUS.CREATED]: () => {
          showToast(MESSAGES.REGISTER_SUCCESS, 'success');
          resetForm();
        },
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
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h3 className={styles.title}>
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h3>

        <form onSubmit={handleSubmit} className={styles.form}>
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

        <button type="button" className={styles.toggle} onClick={() => setIsLogin(!isLogin)}>
          {isLogin
            ? "Don't have an account? Register here."
            : 'Already have an account? Log in here.'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
