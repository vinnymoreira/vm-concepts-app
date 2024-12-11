// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (user === null) {
    // User is not authenticated
    return <Navigate to="/login" replace />;
  }

  // User is authenticated
  return children;
};

export default ProtectedRoute;