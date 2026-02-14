const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  getLeaveTypes,
  getLeaveTypeByCode,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType
} = require('../controllers/leaveTypeController');

/**
 * @route   GET /api/leave-types
 * @desc    Get all leave types
 * @access  Public
 * @query   ?isActive=true
 */
router.get('/', getLeaveTypes);

/**
 * @route   GET /api/leave-types/:code
 * @desc    Get leave type by code
 * @access  Public
 */
router.get('/:code', getLeaveTypeByCode);

/**
 * @route   POST /api/leave-types
 * @desc    Create leave type
 * @access  Private (Admin)
 */
router.post('/', protect, requireAdmin, createLeaveType);

/**
 * @route   PUT /api/leave-types/:code
 * @desc    Update leave type
 * @access  Private (Admin)
 */
router.put('/:code', protect, requireAdmin, updateLeaveType);

/**
 * @route   DELETE /api/leave-types/:code
 * @desc    Delete leave type
 * @access  Private (Admin)
 */
router.delete('/:code', protect, requireAdmin, deleteLeaveType);

module.exports = router;

