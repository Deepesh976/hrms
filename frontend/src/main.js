import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';

import AdminNavbar from './components/Navbar/adminnavbar';
import SuperNavbar from './components/Navbar/supernavbar';
import EmployeeNavbar from './components/Navbar/employeenavbar';
import DirectorNavbar from './components/Navbar/directornavbar';
import HODNavbar from './components/Navbar/hodnavbar';

import EmployeeDashboard from './components/Dashboard/EmployeeDashboard';
import HREmployeeDashboard from './components/Dashboard/HREmployeeDashboard';
import DirectorDashboard from './components/Dashboard/DirectorDashboard';
import HODDashboard from './components/Dashboard/HODDashboard';

import EmployeeAttendance from './biometric/EmployeeAttendance';
import EmployeePayslip from './biometric/EmployeePayslip';
import EmployeeLeavesCalendar from './biometric/EmployeeLeavesCalendar';
import EmployeeLeaveRequest from './biometric/EmployeeLeaveRequest';
import EmployeeAssets from './biometric/EmployeeAssets';

import EmployeeActivity from './biometric/EmployeeActivity';
import UploadAttendance from './biometric/UploadAttendance';
import GenerateSlip from './biometric/GenerateSlip';
import SalarySlip from './biometric/SalarySlip';

import EmployeeInfo from './biometric/EmployeeInfo';
import AddEmployeeInfo from './biometric/AddEmployeeInfo';
import EditEmployeeInfo from './biometric/EditEmployeeInfo';
import EmployeeSalaryInfo from './biometric/EmployeeSalaryInfo';
import EditEmployeeSalaryInfo from './biometric/EditEmployeeSalaryInfo';

import Profile from './biometric/Profile';
import InputData from './biometric/InputData';
import CreateAdmin from './biometric/CreateAdmin';

import HrAssets from './biometric/HrAssets';
import HrLeaveCalendar from './biometric/HrLeaveCalendar';
import HrLeaveRequests from './biometric/HrLeaveRequests';
import HODAssets from './biometric/HODAssets';
import DirectorAssets from './biometric/DirectorAssets';

import ManageHODs from './biometric/ManageHODs';
import ManageDirectors from './biometric/ManageDirectors';
import ManagePasswords from './biometric/ManagePasswords';

import SalaryHistory from './biometric/SalaryHistory';
import MonthlySummaryPage from './biometric/MonthlySummaryPage';

import LoadingButton from './components/Auth/LoadingButton';
import LoadingSpinner from './components/Auth/LoadingSpinner';
import NotificationsPage from './components/Notifications/NotificationsPage';

/* =========================
   AUTH REDIRECT
========================= */
const AuthRedirect = () => {
  const token = localStorage.getItem('token');
  const expiry = Number(localStorage.getItem('expiry'));
  const role = localStorage.getItem('role');

  if (token && expiry && Date.now() < expiry) {
    switch (role) {
      case 'super_admin':
      case 'hrms_handler':
      case 'admin':        // legacy
      case 'superadmin':   // legacy
        return <Navigate to="/dashboard" replace />;

      case 'director':
        return <Navigate to="/director-dashboard" replace />;

      case 'hod':
        return <Navigate to="/hod-dashboard" replace />;

      case 'employee':
        return <Navigate to="/employee-dashboard" replace />;

      case 'hr-employee':  // legacy
        return <Navigate to="/hr-employee-dashboard" replace />;

      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  localStorage.clear();
  return <Navigate to="/login" replace />;
};

/* =========================
   APP CONTENT
========================= */
const AppContent = () => {
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);

  const hideNavbar = location.pathname === '/login';

  useEffect(() => {
    setUserRole(localStorage.getItem('role'));
  }, [location]);

  const renderNavbar = () => {
    switch (userRole) {
      case 'super_admin':
        return <SuperNavbar />;
      case 'hrms_handler':
        // case 'admin': // legacy
        return <AdminNavbar />;
      case 'director':
        return <DirectorNavbar />;
      case 'hod':
        return <HODNavbar />;
      case 'employee':
      case 'hr-employee': // legacy
        return <EmployeeNavbar />;
      default:
        return null;
    }
  };

  return (
    <>
      {!hideNavbar && renderNavbar()}

      <Routes>
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* ================= DASHBOARDS ================= */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/director-dashboard" element={
          <ProtectedRoute allowedRoles={['director']}>
            <DirectorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/hod-dashboard" element={
          <ProtectedRoute allowedRoles={['hod']}>
            <HODDashboard />
          </ProtectedRoute>
        } />

        <Route path="/employee-dashboard" element={
          <ProtectedRoute allowedRoles={['employee', 'hr-employee']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        } />

        <Route path="/hr-employee-dashboard" element={
          <ProtectedRoute allowedRoles={['hr-employee']}>
            <HREmployeeDashboard />
          </ProtectedRoute>
        } />

        {/* ================= SUPER ADMIN ONLY ================= */}
        <Route path="/create-admin" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <CreateAdmin />
          </ProtectedRoute>
        } />

        {/* ================= HRMS / ADMIN ================= */}
        <Route path="/add-employee-info" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <AddEmployeeInfo />
          </ProtectedRoute>
        } />

        <Route path="/edit-employee-info/:id" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <EditEmployeeInfo />
          </ProtectedRoute>
        } />

        <Route path="/employee-salary-info" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <EmployeeSalaryInfo />
          </ProtectedRoute>
        } />

        <Route path="/edit-employee-salary-info/:id" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <EditEmployeeSalaryInfo />
          </ProtectedRoute>
        } />

        <Route path="/generate-slip" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <GenerateSlip />
          </ProtectedRoute>
        } />

        <Route path="/salary-slip" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <SalarySlip />
          </ProtectedRoute>
        } />

        <Route path="/upload-attendance" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <UploadAttendance />
          </ProtectedRoute>
        } />

        <Route path="/input-data" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <InputData />
          </ProtectedRoute>
        } />

        <Route path="/salary-history/:empId" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <SalaryHistory />
          </ProtectedRoute>
        } />

        <Route path="/monthly-summary/:empId" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <MonthlySummaryPage />
          </ProtectedRoute>
        } />

        {/* ================= MANAGEMENT ================= */}
        <Route path="/manage-hods" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'director', 'admin', 'superadmin']}>
            <ManageHODs />
          </ProtectedRoute>
        } />

        <Route path="/manage-directors" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <ManageDirectors />
          </ProtectedRoute>
        } />

        <Route path="/manage-passwords" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'admin', 'superadmin']}>
            <ManagePasswords />
          </ProtectedRoute>
        } />

        {/* ================= SHARED ================= */}
        <Route path="/employee-info" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'director', 'hod', 'admin', 'superadmin']}>
            <EmployeeInfo />
          </ProtectedRoute>
        } />

        <Route path="/employee-activity" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'director', 'hod', 'admin', 'superadmin']}>
            <EmployeeActivity />
          </ProtectedRoute>
        } />

        <Route path="/hr-assets" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'director', 'hod', 'admin', 'superadmin']}>
            <HrAssets />
          </ProtectedRoute>
        } />

        <Route path="/hod-assets" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'director', 'hod', 'admin', 'superadmin']}>
            <HODAssets />
          </ProtectedRoute>
        } />

        <Route path="/director-assets" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'director', 'hod', 'admin', 'superadmin']}>
            <DirectorAssets />
          </ProtectedRoute>
        } />

        <Route path="/hr-leave-calendar" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'director', 'hod', 'admin', 'superadmin', 'employee']}>
            <HrLeaveCalendar />
          </ProtectedRoute>
        } />

        <Route path="/hr-leave-requests" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hrms_handler', 'director', 'hod', 'admin', 'superadmin']}>
            <HrLeaveRequests />
          </ProtectedRoute>
        } />

        {/* ================= COMMON ================= */}
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* ================= EMPLOYEE ================= */}
        <Route path="/employee-attendance" element={
          <ProtectedRoute allowedRoles={['employee', 'hr-employee']}>
            <EmployeeAttendance />
          </ProtectedRoute>
        } />

        <Route path="/employee-payslip" element={
          <ProtectedRoute allowedRoles={['employee', 'hr-employee']}>
            <EmployeePayslip />
          </ProtectedRoute>
        } />

        <Route path="/employee-leaves-calendar" element={
          <ProtectedRoute allowedRoles={['employee', 'hr-employee']}>
            <EmployeeLeavesCalendar />
          </ProtectedRoute>
        } />

        <Route path="/employee-leave-request" element={
          <ProtectedRoute allowedRoles={['employee', 'hr-employee']}>
            <EmployeeLeaveRequest />
          </ProtectedRoute>
        } />

        <Route path="/employee-assets" element={
          <ProtectedRoute allowedRoles={['employee', 'hr-employee']}>
            <EmployeeAssets />
          </ProtectedRoute>
        } />

        {/* ================= UTIL ================= */}
        <Route path="/loading_button" element={<ProtectedRoute><LoadingButton /></ProtectedRoute>} />
        <Route path="/loading_spinner" element={<ProtectedRoute><LoadingSpinner /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
