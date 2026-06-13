/**
 * @file        ProtectedRoute.jsx
 * @module      components
 * @description Guard component that protects customer routes and redirects to login if unauthenticated.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @function  ProtectedRoute
 * @summary   Route wrapper that enforces active customer authentication
 * @param     {object} props - React properties
 * @param     {React.ReactNode} props.children - Protected child elements
 * @returns   {React.ReactElement} The child elements or redirect logic
 */
function ProtectedRoute({ children }) {
  const { customerAuth, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-darker">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          <span className="absolute text-xs font-semibold text-brand-primary uppercase tracking-wider animate-pulse-slow">Pizza</span>
        </div>
      </div>
    );
  }

  if (!customerAuth.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
