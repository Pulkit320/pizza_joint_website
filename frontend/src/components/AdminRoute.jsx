/**
 * @file        AdminRoute.jsx
 * @module      components
 * @description Guard component that protects administrative routes and redirects if role is not admin.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @function  AdminRoute
 * @summary   Route wrapper that enforces active administrator authentication and role checks
 * @param     {object} props - React properties
 * @param     {React.ReactNode} props.children - Admin-only child elements
 * @returns   {React.ReactElement} The child elements or redirect logic
 */
function AdminRoute({ children }) {
  const { staffAuth, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-darker">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          <span className="absolute text-xs font-semibold text-brand-primary uppercase tracking-wider animate-pulse-slow">Admin</span>
        </div>
      </div>
    );
  }

  if (!staffAuth.isLoggedIn) {
    return <Navigate to="/staff/login" replace />;
  }

  if (!staffAuth.isAdmin) {
    console.warn(`AdminRoute: Access denied for role: ${staffAuth.role}. Redirecting to Home.`);
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
