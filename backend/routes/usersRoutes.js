const express = require('express');
const router = express.Router();

const controller = require('../controllers/usersController');
const {
  protect,
  authorizeRoles,
  requireSuperAdmin,
} = require('../middleware/authMiddleware');

const { ROLES } = require('../utils/rolePermissions');

/* =========================================================
   USER MANAGEMENT (ADMIN / HRMS ONLY)
========================================================= */

/**
 * Create User
 * Access: Super Admin / HRMS Handler
 */
router.post(
  '/',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER),
  controller.createUser
);

/**
 * List All Users (Basic)
 * Access: Super Admin / HRMS Handler
 */
router.get(
  '/',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER),
  controller.listUsers
);

/**
 * ✅ List Users With Employee Info
 * Used in Manage Passwords page
 * Access: Super Admin / HRMS Handler
 */
router.get(
  '/with-employee',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER),
  controller.listUsersWithEmployee
);

/**
 * Get Single User
 */
router.get(
  '/:id',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER),
  controller.getUserById
);

/**
 * Update User (Excluding Password)
 */
router.put(
  '/:id',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER),
  controller.updateUser
);

/**
 * Delete User (Super Admin Only)
 */
router.delete(
  '/:id',
  protect,
  requireSuperAdmin,
  controller.deleteUser
);

/* =========================================================
   PASSWORD MANAGEMENT
========================================================= */

/**
 * Reset Password (HR / Super Admin)
 */
router.post(
  '/:userId/reset-password',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER),
  controller.resetPasswordByHR
);

/**
 * Change Own Password
 */
router.post(
  '/change-password',
  protect,
  controller.changePassword
);

module.exports = router;
