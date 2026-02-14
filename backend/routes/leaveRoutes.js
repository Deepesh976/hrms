const express = require('express');
const router = express.Router();

const {
  protect,
  authorizeRoles,
  requireAdmin,
} = require('../middleware/authMiddleware');

const {
  applyLeave,
  getMyLeaves,
  listAllRequests,
  getLeaveDetails,
  approveLeave,
  rejectLeave,
  cancelLeave,
  updateLeaveStatus,
  getMyLeaveBalance,
  getEmployeeBalance,
  adjustLeaveBalance,
  calculateWorkingDaysEndpoint,
  getMyApprovals,
  getEmployeeHierarchy,
} = require('../controllers/leaveController');

/* =====================================================
   EMPLOYEE ROUTES
===================================================== */

/**
 * Apply for leave
 * POST /api/leaves/request
 */
router.post('/request', protect, applyLeave);

/**
 * Get my leave requests
 * GET /api/leaves/my-requests
 */
router.get('/my-requests', protect, getMyLeaves);

/**
 * Get my leave balance
 * GET /api/leaves/balance?empId=EMP001
 */
router.get('/balance', protect, getMyLeaveBalance);

/**
 * Cancel leave request
 * PUT /api/leaves/requests/:id/cancel
 */
router.put('/requests/:id/cancel', protect, cancelLeave);

/* =====================================================
   APPROVAL / HIERARCHY ROUTES
===================================================== */

/**
 * Leaves pending my approval
 * GET /api/leaves/my-approvals
 * Only HOD & Director
 */
router.get(
  '/my-approvals',
  protect,
  authorizeRoles('hod', 'director'),
  getMyApprovals
);

/**
 * Get employee hierarchy
 * GET /api/leaves/hierarchy/:employeeId
 */
router.get('/hierarchy/:employeeId', protect, getEmployeeHierarchy);

/* =====================================================
   VIEW ROUTES (HRMS + HOD + DIRECTOR + ADMIN)
   ⚠️ VIEW ONLY — NO ACTIONS
===================================================== */

/**
 * Get all leave requests
 * GET /api/leaves
 * GET /api/leaves/requests
 *
 * HRMS CAN VIEW
 */
router.get(
  '/',
  protect,
  authorizeRoles('super_admin', 'hrms_handler', 'director', 'hod'),
  listAllRequests
);

router.get(
  '/requests',
  protect,
  authorizeRoles('super_admin', 'hrms_handler', 'director', 'hod'),
  listAllRequests
);

/**
 * Get leave request details
 * GET /api/leaves/requests/:id
 */
router.get(
  '/requests/:id',
  protect,
  authorizeRoles('super_admin', 'hrms_handler', 'director', 'hod', 'employee'),
  getLeaveDetails
);

/* =====================================================
   APPROVE / REJECT (STRICT)
   ❌ HRMS BLOCKED
===================================================== */

/**
 * Approve leave
 * PUT /api/leaves/requests/:id/approve
 */
router.put(
  '/requests/:id/approve',
  protect,
  authorizeRoles('hod', 'director'),
  approveLeave
);

/**
 * Reject leave
 * PUT /api/leaves/requests/:id/reject
 */
router.put(
  '/requests/:id/reject',
  protect,
  authorizeRoles('hod', 'director'),
  rejectLeave
);

/**
 * Generic status update (legacy)
 * PUT /api/leaves/:id/status
 * ❌ HRMS BLOCKED
 */
router.put(
  '/:id/status',
  protect,
  authorizeRoles('hod', 'director'),
  updateLeaveStatus
);

/* =====================================================
   BALANCE MANAGEMENT
===================================================== */

/**
 * Get employee leave balance (Admin/HOD)
 * GET /api/leaves/balance/:empId
 */
router.get(
  '/balance/:empId',
  protect,
  authorizeRoles('super_admin', 'director', 'hod'),
  getEmployeeBalance
);

/**
 * Adjust leave balance (Admin only)
 * POST /api/leaves/balance/adjust
 */
router.post(
  '/balance/adjust',
  protect,
  requireAdmin,
  adjustLeaveBalance
);

/* =====================================================
   UTILITIES
===================================================== */

/**
 * Calculate working days
 * POST /api/leaves/calculate-working-days
 */
router.post(
  '/calculate-working-days',
  protect,
  calculateWorkingDaysEndpoint
);

/* =====================================================
   BACKWARD COMPATIBILITY (DEPRECATED)
===================================================== */

router.post('/', protect, applyLeave);        // old apply
router.get('/my', protect, getMyLeaves);      // old my leaves

module.exports = router;
