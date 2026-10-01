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

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { authenticated } = useAuth();
  return authenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function AppContent() {
  const auth = useAuth();
  const [toastMessage, updateToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [toastId, setToastId] = useState(0);
  const setToastMessage = useCallback((message: string) => {
    updateToastMessage(message);
    if (message) setToastId((id) => id + 1);
  }, []);
  const closeToast = useCallback(() => updateToastMessage(''), []);
  useEffect(() => subscribeExpiration(() => {
    setToastMessage(MESSAGES.SESSION_EXPIRED_ERROR);
    setToastType('error');
  }), [setToastMessage]);

  return (
    <Router>
      {auth.checking || auth.error ? (
        <main className="flex min-h-dvh items-center justify-center bg-bg p-8 text-content">
          <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-xl border border-divider bg-surface p-8 text-center">
            {auth.checking ? <p role="status">Restoring session...</p> : <>
              <p role="alert">Could not restore your session. Please try again.</p>
              <Button onClick={auth.retry} text="Retry" />
            </>}
          </div>
        </main>
      ) : <Routes>
        <Route path="/" element={auth.authenticated ? <Navigate to="/dashboard" replace /> : <AuthForm setToastMessage={setToastMessage} setToastType={setToastType} />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard key={auth.sessionId} setToastMessage={setToastMessage} setToastType={setToastType} />
            </PrivateRoute>
          }
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
