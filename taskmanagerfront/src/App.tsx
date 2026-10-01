import './App.css';
import AuthForm from './pages/AuthForm/AuthForm';
import Dashboard from './pages/Dashboard/Dashboard';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useCallback, useState } from 'react';
import Toast from './components/ui/Toast/Toast';
import type { ToastType } from './types';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  const [toastMessage, updateToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [toastId, setToastId] = useState(0);
  const setToastMessage = useCallback((message: string) => {
    updateToastMessage(message);
    if (message) setToastId((id) => id + 1);
  }, []);
  const closeToast = useCallback(() => updateToastMessage(''), []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm setToastMessage={setToastMessage} setToastType={setToastType} />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard setToastMessage={setToastMessage} setToastType={setToastType} />
            </PrivateRoute>
          }
        />
      </Routes>
      {toastMessage && <Toast key={toastId} message={toastMessage} type={toastType} onClose={closeToast} />}
    </Router>
  );
}

export default App;
