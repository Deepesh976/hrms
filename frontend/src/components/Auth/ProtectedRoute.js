// src/components/Auth/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const VALID_ROLES = [
  'super_admin',
  'hrms_handler',
  'director',
  'hod',
  'employee',
];

const DASHBOARD_BY_ROLE = {
  super_admin: '/dashboard',
  hrms_handler: '/dashboard',
  director: '/director-dashboard',
  hod: '/hod-dashboard',
  employee: '/employee-dashboard',
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const expiry = localStorage.getItem('expiry');
  const mustChangePassword = localStorage.getItem('mustChangePassword');

  /* =========================
     AUTH CHECK
  ========================= */

  if (!token) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  /* =========================
     TOKEN EXPIRY CHECK
  ========================= */

  const expiryTime = Number(expiry);

  if (!expiryTime || Date.now() > expiryTime) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  /* =========================
     ROLE VALIDATION
  ========================= */

  if (!VALID_ROLES.includes(role)) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  /* =========================
     PREVENT LOGIN PAGE ACCESS
     WHEN ALREADY LOGGED IN
  ========================= */

  if (token && location.pathname === '/login') {
    const redirectPath = DASHBOARD_BY_ROLE[role] || '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  /* =========================
     FORCE PASSWORD CHANGE
     (ALLOW ONLY PROFILE PAGE)
  ========================= */

  if (mustChangePassword === 'true' && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  /* =========================
     ROLE-BASED ACCESS CONTROL
  ========================= */

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const redirectPath = DASHBOARD_BY_ROLE[role] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
