// src/components/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a loading spinner
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;