import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoutes: React.FC<React.PropsWithChildren> = ({ children }) => {
    const userData = localStorage.getItem('yourpholio');
    const userInLocalStorage = userData ? JSON.parse(userData)?.uid : null;

    if (!userInLocalStorage) {
        return <Navigate to="/signin" />;
    }

    return children;
};

export default ProtectedRoutes;
