const asyncHandler = require('../middleware/asyncHandler');
const {
  getAllHODs,
  getHODById,
  createHOD,
  updateHOD,
  deleteHOD,
  assignEmployeesToHOD,
  unassignEmployeeFromHOD,
  getUnassignedEmployees,
  getHODEmployees
} = require('../services/hodService');

/**
 * @desc    Get all HODs
 * @route   GET /api/hods
 * @access  Private (HRMS Handler, Super Admin)
 */
const getHODs = asyncHandler(async (req, res) => {
  const hods = await getAllHODs();
  
  res.status(200).json({
    success: true,
    count: hods.length,
    data: hods
  });
});

/**
 * @desc    Get HOD by ID
 * @route   GET /api/hods/:id
 * @access  Private (HRMS Handler, Super Admin)
 */
const getHOD = asyncHandler(async (req, res) => {
  const hod = await getHODById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: hod
  });
});

/**
 * @desc    Create new HOD
 * @route   POST /api/hods
 * @access  Private (HRMS Handler, Super Admin)
 */
const createNewHOD = asyncHandler(async (req, res) => {
  const { department } = req.body;

  // ✅ ADD THIS VALIDATION
  if (!department) {
    return res.status(400).json({
      success: false,
      message: 'Department is required for HOD',
    });
  }

  const hod = await createHOD(req.body);

  res.status(201).json({
    success: true,
    message: 'HOD created successfully',
    data: hod,
  });
});

/**
 * @desc    Update HOD
 * @route   PUT /api/hods/:id
 * @access  Private (HRMS Handler, Super Admin)
 */
const updateHODById = asyncHandler(async (req, res) => {
  const hod = await updateHOD(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'HOD updated successfully',
    data: hod
  });
});

/**
 * @desc    Delete HOD
 * @route   DELETE /api/hods/:id
 * @access  Private (HRMS Handler, Super Admin)
 */
const deleteHODById = asyncHandler(async (req, res) => {
  const result = await deleteHOD(req.params.id);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
});

/**
 * @desc    Assign employees to HOD
 * @route   POST /api/hods/:hodId/assign-employees
 * @access  Private (HRMS Handler, Super Admin)
 */
const assignEmployees = asyncHandler(async (req, res) => {
  const { hodId } = req.params;
  const { employeeIds } = req.body;
  
  if (!employeeIds || !Array.isArray(employeeIds)) {
    return res.status(400).json({
      success: false,
      message: 'employeeIds must be an array'
    });
  }
  
  const results = await assignEmployeesToHOD(hodId, employeeIds);
  
  res.status(200).json({
    success: true,
    message: `${results.success.length} employee(s) assigned successfully`,
    data: results
  });
});

/**
 * @desc    Unassign employee from HOD
 * @route   POST /api/hods/:hodId/unassign-employee/:employeeId
 * @access  Private (HRMS Handler, Super Admin)
 */
const unassignEmployee = asyncHandler(async (req, res) => {
  const { hodId, employeeId } = req.params;
  
  const result = await unassignEmployeeFromHOD(hodId, employeeId);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
});

/**
 * @desc    Get employees assigned to HOD
 * @route   GET /api/hods/:hodId/employees
 * @access  Private
 */
const getAssignedEmployees = asyncHandler(async (req, res) => {
  const { hodId } = req.params;
  
  const employees = await getHODEmployees(hodId);
  
  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees
  });
});

/**
 * @desc    Get unassigned employees (not assigned to any HOD)
 * @route   GET /api/hods/unassigned-employees
 * @access  Private (HRMS Handler, Super Admin)
 */
const getUnassigned = asyncHandler(async (req, res) => {
  const employees = await getUnassignedEmployees();
  
  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees
  });
});

module.exports = {
  getHODs,
  getHOD,
  createNewHOD,
  updateHODById,
  deleteHODById,
  assignEmployees,
  unassignEmployee,
  getAssignedEmployees,
  getUnassigned
};
