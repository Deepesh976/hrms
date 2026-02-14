/**
 * Role Permissions & Constants
 * Centralized role management and permission checks
 */

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HRMS_HANDLER: 'hrms_handler',
  DIRECTOR: 'director',
  HOD: 'hod',
  EMPLOYEE: 'employee'
};

const ROLE_HIERARCHY = {
  super_admin: 5,
  hrms_handler: 4,
  director: 3,
  hod: 2,
  employee: 1
};

/**
 * Role Display Names
 */
const ROLE_NAMES = {
  super_admin: 'Super Admin',
  hrms_handler: 'HRMS Handler',
  director: 'Director',
  hod: 'Head of Department',
  employee: 'Employee'
};

/**
 * Permissions Matrix
 */
const PERMISSIONS = {
  // User Management
  CREATE_SUPER_ADMIN: [ROLES.SUPER_ADMIN],
  CREATE_HRMS_HANDLER: [ROLES.SUPER_ADMIN],
  CREATE_DIRECTOR: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  CREATE_HOD: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  CREATE_EMPLOYEE_USER: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  DELETE_USER: [ROLES.SUPER_ADMIN],
  
  // Employee Management
  CREATE_EMPLOYEE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  UPDATE_EMPLOYEE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  DELETE_EMPLOYEE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  VIEW_ALL_EMPLOYEES: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR],
  VIEW_DEPARTMENT_EMPLOYEES: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD],
  VIEW_OWN_PROFILE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD, ROLES.EMPLOYEE],
  
  // Salary Management
  VIEW_ALL_SALARIES: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  VIEW_SALARY_INFO: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  GENERATE_SALARY: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  VIEW_OWN_SALARY: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD, ROLES.EMPLOYEE],
  
  // Attendance Management
  UPLOAD_ATTENDANCE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  VIEW_ALL_ATTENDANCE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR],
  VIEW_DEPARTMENT_ATTENDANCE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD],
  VIEW_OWN_ATTENDANCE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD, ROLES.EMPLOYEE],
  
  // Leave Management
  VIEW_ALL_LEAVE_REQUESTS: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR],
  VIEW_DEPARTMENT_LEAVE_REQUESTS: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD],
  APPROVE_ANY_LEAVE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  APPROVE_DEPARTMENT_LEAVE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.HOD],
  APPLY_LEAVE: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD, ROLES.EMPLOYEE],
  VIEW_OWN_LEAVES: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD, ROLES.EMPLOYEE],
  MANAGE_LEAVE_CALENDAR: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR],
  VIEW_LEAVE_CALENDAR: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD, ROLES.EMPLOYEE],
  
  // Asset Management
  ASSIGN_ASSETS: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  VIEW_ALL_ASSETS: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR],
  VIEW_DEPARTMENT_ASSETS: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD],
  VIEW_OWN_ASSETS: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD, ROLES.EMPLOYEE],
  
  // Reports
  GENERATE_ALL_REPORTS: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR],
  GENERATE_DEPARTMENT_REPORTS: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER, ROLES.DIRECTOR, ROLES.HOD],
  
  // System Configuration
  MANAGE_LEAVE_POLICIES: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  MANAGE_LEAVE_TYPES: [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER],
  SYSTEM_SETTINGS: [ROLES.SUPER_ADMIN]
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
  if (!PERMISSIONS[permission]) {
    console.warn(`Permission "${permission}" not found in PERMISSIONS`);
    return false;
  }
  return PERMISSIONS[permission].includes(role);
};

/**
 * Check if user can view salary information
 * @param {string} role - User role
 * @returns {boolean}
 */
const canViewSalary = (role) => {
  return [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER].includes(role);
};

/**
 * Check if user needs department filtering
 * @param {string} role - User role
 * @returns {boolean}
 */
const needsDepartmentFilter = (role) => {
  return role === ROLES.HOD;
};

/**
 * Check if user can only view own data
 * @param {string} role - User role
 * @returns {boolean}
 */
const isOwnDataOnly = (role) => {
  return role === ROLES.EMPLOYEE;
};

/**
 * Get allowed roles for a permission
 * @param {string} permission - Permission name
 * @returns {Array<string>}
 */
const getAllowedRoles = (permission) => {
  return PERMISSIONS[permission] || [];
};

/**
 * Check if role A can manage role B
 * @param {string} managerRole - Role doing the management
 * @param {string} targetRole - Role being managed
 * @returns {boolean}
 */
const canManageRole = (managerRole, targetRole) => {
  // Super admin can manage all roles
  if (managerRole === ROLES.SUPER_ADMIN) {
    return true;
  }
  
  // HRMS handler cannot create super admin or other HRMS handlers
  if (managerRole === ROLES.HRMS_HANDLER) {
    return ![ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER].includes(targetRole);
  }
  
  return false;
};

/**
 * Get dashboard route based on role
 * @param {string} role - User role
 * @returns {string}
 */
const getDashboardRoute = (role) => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.HRMS_HANDLER:
      return '/dashboard';
    case ROLES.DIRECTOR:
      return '/director-dashboard';
    case ROLES.HOD:
      return '/hod-dashboard';
    case ROLES.EMPLOYEE:
      return '/employee-dashboard';
    default:
      return '/login';
  }
};

/**
 * Check if role is admin level (super admin or hrms handler)
 * @param {string} role - User role
 * @returns {boolean}
 */
const isAdminLevel = (role) => {
  return [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER].includes(role);
};

/**
 * Check if role has read-only access
 * @param {string} role - User role
 * @returns {boolean}
 */
const isReadOnly = (role) => {
  return role === ROLES.DIRECTOR;
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_NAMES,
  PERMISSIONS,
  hasPermission,
  canViewSalary,
  needsDepartmentFilter,
  isOwnDataOnly,
  getAllowedRoles,
  canManageRole,
  getDashboardRoute,
  isAdminLevel,
  isReadOnly
};

