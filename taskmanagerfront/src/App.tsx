import AuthForm from './pages/AuthForm/AuthForm';
import Dashboard from './pages/Dashboard/Dashboard';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { MESSAGES } from './config/messages';
import { subscribeExpiration } from './services/session';
import Button from './components/ui/Button/Button';
import Toast from './components/ui/Toast/Toast';
import type { ToastType } from './types';

function AppContent() {
  const auth = useAuth();
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [toastId, setToastId] = useState(0);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    if (message) setToastId((id) => id + 1);
  }, []);

  const closeToast = useCallback(() => setToastMessage(''), []);

  useEffect(() => subscribeExpiration(() => {
    showToast(MESSAGES.SESSION_EXPIRED_ERROR, 'error');
  }), [showToast]);

  return (
    <Router>
      {auth.checking || auth.error ? (
        <main className="flex min-h-dvh items-center justify-center bg-bg p-8 text-content">
          <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-xl border border-divider bg-surface p-8 text-center">
            {auth.checking ? <output>Restoring session...</output> : <>
              <p role="alert">Could not restore your session. Please try again.</p>
              <Button onClick={auth.retry} text="Retry" />
            </>}
          </div>
        </main>
      ) : <Routes>
        <Route path="/" element={auth.authenticated ? <Navigate to="/dashboard" replace /> : <AuthForm showToast={showToast} />} />
        <Route
          path="/dashboard"
          element={auth.authenticated
            ? <Dashboard key={auth.sessionId} showToast={showToast} />
            : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to={auth.authenticated ? '/dashboard' : '/'} replace />} />
      </Routes>}
      {toastMessage && <Toast key={toastId} message={toastMessage} type={toastType} onClose={closeToast} />}
    </Router>
  );
}

function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}

export default App;
