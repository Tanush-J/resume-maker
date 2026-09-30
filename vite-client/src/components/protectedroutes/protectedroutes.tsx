import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';

const ProtectedRoutes: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user, isInitialized } = useSelector((s: RootState) => s.auth);

    if (!isInitialized) {
        return <div className="loading-screen" />;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoutes;
