const express = require('express');
const router = express.Router();
const slipController = require('../controllers/slipController');
const { protect, requireAdmin, authorizeRoles } = require('../middleware/authMiddleware');

// ========================================
// SALARY SLIP ROUTES
// Base path: /api/slips
// ========================================

/**
 * @route   POST /api/slips
 * @desc    Create salary slip
 * @access  Private (Admin only)
 */
router.post(
  '/',
  protect,
  requireAdmin,
  slipController.createSlip
);

/**
 * @route   GET /api/slips
 * @desc    Get all salary slips
 * @access  Private (Admin only)
 */
router.get(
  '/',
  protect,
  requireAdmin,
  slipController.getAllSlips
);

/**
 * @route   GET /api/slips/download/:id
 * @desc    Download salary slip PDF
 * @access  Private (Admin or Employee for own)
 */
router.get(
  '/download/:id',
  protect,
  authorizeRoles('super_admin', 'hrms_handler', 'employee', 'admin', 'superadmin'),
  slipController.downloadSlipPDF
);

/**
 * @route   GET /api/slips/view/:id
 * @desc    View salary slip PDF
 * @access  Private (Admin or Employee for own)
 */
router.get(
  '/view/:id',
  protect,
  authorizeRoles('super_admin', 'hrms_handler', 'employee', 'admin', 'superadmin'),
  slipController.viewSlipPDF
);

/**
 * @route   GET /api/slips/details/:empId
 * @desc    Fetch employee & salary details (supports ?month=&year=)
 * @access  Private (Admin or Employee for own)
 */
router.get(
  '/details/:empId',
  protect,
  authorizeRoles('super_admin', 'hrms_handler', 'employee', 'admin', 'superadmin'),
  slipController.getEmployeeSalaryDetails
);

/**
 * @route   GET /api/slips/periods/:empId
 * @desc    Get available salary months/years for a specific employee (for admin GenerateSlip)
 * @access  Private (Admin roles)
 */
router.get(
  '/periods/:empId',
  protect,
  authorizeRoles('super_admin', 'hrms_handler', 'admin', 'superadmin'),
  slipController.getEmployeeAvailableSlipPeriods
);

// ========================================
// EMPLOYEE SELF-SERVICE ROUTES
// ========================================

/**
 * @route   GET /api/slips/my/available-periods
 * @desc    Get available salary periods for logged-in employee
 * @access  Private (Employee only)
 */
router.get(
  '/my/available-periods',
  protect,
  authorizeRoles('employee'),
  slipController.getMyAvailableSlipPeriods
);

/**
 * @route   GET /api/slips/my/list
 * @desc    Get all salary slips for logged-in employee
 * @access  Private (Employee only)
 */
router.get(
  '/my/list',
  protect,
  authorizeRoles('employee'),
  slipController.getMySlips
);

/**
 * @route   POST /api/slips/my/generate
 * @desc    Generate salary slip for logged-in employee
 * @access  Private (Employee only)
 */
router.post(
  '/my/generate',
  protect,
  authorizeRoles('employee'),
  slipController.generateMySlip
);

/**
 * @route   DELETE /api/slips/my/:id
 * @desc    Delete a salary slip of logged-in employee (self-service)
 * @access  Private (Employee only)
 */
router.delete(
  '/my/:id',
  protect,
  authorizeRoles('employee'),
  slipController.deleteMySlip
);

// ========================================
// GENERIC ID ROUTES (keep LAST)
// ========================================

/**
 * @route   GET /api/slips/:id
 * @desc    Get salary slip by ID
 * @access  Private (Admin or Employee for own)
 */
router.get(
  '/:id',
  protect,
  authorizeRoles('super_admin', 'hrms_handler', 'employee', 'admin', 'superadmin'),
  slipController.getSlipById
);

/**
 * @route   DELETE /api/slips/:id
 * @desc    Delete salary slip
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  protect,
  requireAdmin,
  slipController.deleteSlip
);

module.exports = router;
