import './App.css'
import AuthForm from './pages/AuthForm/AuthForm.jsx';
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import React, {useState} from "react";
import Toast from "./components/ui/Toast/Toast.jsx";

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('access_token');
    return token ? children : <Navigate to="/" />;
};

function App() {
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        <AuthForm
                        setToastMessage={setToastMessage}
                        setToastType={setToastType}/>
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