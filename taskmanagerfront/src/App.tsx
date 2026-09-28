import './App.css';
import AuthForm from './pages/AuthForm/AuthForm';
import Dashboard from './pages/Dashboard/Dashboard';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useState } from 'react';
import Toast from './components/ui/Toast/Toast';
import type { ToastType } from './types';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AuthForm
              setToastMessage={setToastMessage}
              setToastType={setToastType}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard
                setToastMessage={setToastMessage}
                setToastType={setToastType}
              />
            </PrivateRoute>
          }
        />
      </Routes>
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

export default App;
