const asyncHandler = require('../middleware/asyncHandler');
const LeaveType = require('../models/LeaveType');

/**
 * @desc    Get all leave types
 * @route   GET /api/leave-types
 * @access  Public
 */
const getLeaveTypes = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  const leaveTypes = await LeaveType.find(filter).sort({ displayOrder: 1, code: 1 });
  
  res.status(200).json(leaveTypes);
});

/**
 * @desc    Get leave type by code
 * @route   GET /api/leave-types/:code
 * @access  Public
 */
const getLeaveTypeByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  
  const leaveType = await LeaveType.findOne({ code: code.toUpperCase() });
  
  if (!leaveType) {
    return res.status(404).json({
      success: false,
      message: 'Leave type not found'
    });
  }
  
  res.status(200).json(leaveType);
});

/**
 * @desc    Create leave type
 * @route   POST /api/leave-types
 * @access  Private (Admin)
 */
const createLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await LeaveType.create(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Leave type created successfully',
    data: leaveType
  });
});

/**
 * @desc    Update leave type
 * @route   PUT /api/leave-types/:code
 * @access  Private (Admin)
 */
const updateLeaveType = asyncHandler(async (req, res) => {
  const { code } = req.params;
  
  const leaveType = await LeaveType.findOneAndUpdate(
    { code: code.toUpperCase() },
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!leaveType) {
    return res.status(404).json({
      success: false,
      message: 'Leave type not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Leave type updated successfully',
    data: leaveType
  });
});

/**
 * @desc    Delete leave type
 * @route   DELETE /api/leave-types/:code
 * @access  Private (Admin)
 */
const deleteLeaveType = asyncHandler(async (req, res) => {
  const { code } = req.params;
  
  const leaveType = await LeaveType.findOneAndDelete({ code: code.toUpperCase() });
  
  if (!leaveType) {
    return res.status(404).json({
      success: false,
      message: 'Leave type not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Leave type deleted successfully'
  });
});

module.exports = {
  getLeaveTypes,
  getLeaveTypeByCode,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType
};

