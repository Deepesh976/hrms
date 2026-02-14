const express = require('express');
const router = express.Router();
const multer = require('multer');

const salaryController = require('../controllers/salaryController');
const { protect, requireAdmin, authorizeRoles } = require('../middleware/authMiddleware');

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// ========================================
// PAYROLL SALARY ROUTES (MONTHLY)
// ========================================

/**
 * @route   POST /api/salaries/upload-excel
 * @desc    Upload salary data from Excel
 * @access  Private (Admin only)
 */
router.post(
  '/upload-excel',
  protect,
  requireAdmin,
  upload.single('file'),
  salaryController.uploadSalaryExcel
);

/**
 * @route   POST /api/salaries/generate-from-employee
 * @desc    Generate salary from employee data
 * @access  Private (Admin only)
 */
router.post(
  '/generate-from-employee',
  protect,
  requireAdmin,
  salaryController.generateSalaryFromEmployee
);

/**
 * @route   POST /api/salaries
 * @desc    Create salary record (manual payroll insert)
 * @access  Private (Admin only)
 */
router.post(
  '/',
  protect,
  requireAdmin,
  salaryController.createSalary
);

/**
 * @route   GET /api/salaries
 * @desc    Get all salaries
 * @access  Private (Admin only)
 */
router.get(
  '/',
  protect,
  requireAdmin,
  salaryController.getAllSalaries
);

/**
 * @route   GET /api/salaries/:id
 * @desc    Get salary by ID
 * @access  Private (Admin / HRMS / Employee own)
 */
router.get(
  '/:id',
  protect,
  authorizeRoles('super_admin', 'hrms_handler', 'employee', 'admin', 'superadmin'),
  salaryController.getSalaryById
);

/**
 * @route   PUT /api/salaries/:id
 * @desc    Update salary
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  protect,
  requireAdmin,
  salaryController.updateSalary
);

/**
 * @route   DELETE /api/salaries/:id
 * @desc    Delete salary
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  protect,
  requireAdmin,
  salaryController.deleteSalary
);

// ========================================
// 🆕 MASTER SALARY ROUTES (VERSIONED CTC)
// ========================================

/**
 * @route   POST /api/salaries/manual-insert
 * @desc    Insert master salary manually (increment)
 * @access  Private (Admin only)
 */
router.post(
  '/manual-insert',
  protect,
  requireAdmin,
  salaryController.insertManualSalary
);

/**
 * @route   GET /api/salaries/by-month
 * @desc    Get master salary for a given employee/month/year
 * @access  Private (Admin only)
 */
router.get(
  '/by-month',
  protect,
  requireAdmin,
  salaryController.getSalaryHistoryForMonthAPI
);

module.exports = router;