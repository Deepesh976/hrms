const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday
} = require('../controllers/leaveCalendarController');

/**
 * @route   GET /api/leave-calendar
 * @desc    Get holidays/calendar
 * @access  Public
 * @query   ?year=2024&month=11&type=public_holiday
 */
router.get('/', getHolidays);

/**
 * @route   POST /api/leave-calendar
 * @desc    Add holiday
 * @access  Private (super_admin, hrms_handler only - HOD and Director have view-only access)
 */
router.post('/', protect, authorizeRoles('super_admin', 'hrms_handler'), addHoliday);

/**
 * @route   PUT /api/leave-calendar/:id
 * @desc    Update holiday
 * @access  Private (super_admin, hrms_handler only - HOD and Director have view-only access)
 */
router.put('/:id', protect, authorizeRoles('super_admin', 'hrms_handler'), updateHoliday);

/**
 * @route   DELETE /api/leave-calendar/:id
 * @desc    Delete holiday
 * @access  Private (super_admin, hrms_handler only - HOD and Director have view-only access)
 */
router.delete('/:id', protect, authorizeRoles('super_admin', 'hrms_handler'), deleteHoliday);

module.exports = router;
