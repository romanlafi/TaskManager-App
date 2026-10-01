import AuthForm from './pages/AuthForm/AuthForm';
import Dashboard from './pages/Dashboard/Dashboard';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { MESSAGES } from './config/messages';
import { subscribeExpiration } from './services/session';
import Toast from './components/ui/Toast/Toast';
import Button from './components/ui/Button/Button';
import type { ToastType } from './types';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { authenticated } = useAuth();
  return authenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function AppContent() {
  const auth = useAuth();
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  useEffect(() => subscribeExpiration(() => {
    setToastMessage(MESSAGES.SESSION_EXPIRED_ERROR);
    setToastType('error');
  }), []);

  return (
    <Router>
      {auth.checking || auth.error ? (
        <main className="min-h-dvh bg-bg flex items-center justify-center p-8 text-content">
          <div className="max-w-[400px] w-full bg-surface p-8 rounded-3xl flex flex-col gap-4 text-center">
            {auth.checking ? <p role="status">Restoring session...</p> : (
              <>
                <p role="alert">Could not restore your session. Please try again.</p>
                <Button onClick={auth.retry} text="Retry" />
              </>
            )}
          </div>
        </main>
      ) : <Routes>
        <Route
          path="/"
          element={
            auth.authenticated ? <Navigate to="/dashboard" replace /> : (
              <AuthForm
                setToastMessage={setToastMessage}
                setToastType={setToastType}
              />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard
                key={auth.sessionId}
                setToastMessage={setToastMessage}
                setToastType={setToastType}
              />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to={auth.authenticated ? '/dashboard' : '/'} replace />} />
      </Routes>}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </Router>
  );
}

function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}

export default App;
