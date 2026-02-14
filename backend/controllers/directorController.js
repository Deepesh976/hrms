const asyncHandler = require('../middleware/asyncHandler');
const {
  getAllDirectors,
  getDirectorById,
  createDirector,
  updateDirector,
  deleteDirector,
  assignHODsToDirector,
  unassignHODFromDirector,
  assignEmployeesToDirector,
  unassignEmployeeFromDirector,
  getUnassignedHODs,
  getCompletelyUnassignedEmployees,
  getDirectorHierarchy
} = require('../services/directorService');

/**
 * @desc    Get all Directors
 * @route   GET /api/directors
 * @access  Private (HRMS Handler, Super Admin)
 */
const getDirectors = asyncHandler(async (req, res) => {
  const directors = await getAllDirectors();
  
  res.status(200).json({
    success: true,
    count: directors.length,
    data: directors
  });
});

/**
 * @desc    Get Director by ID
 * @route   GET /api/directors/:id
 * @access  Private (HRMS Handler, Super Admin)
 */
const getDirector = asyncHandler(async (req, res) => {
  const director = await getDirectorById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: director
  });
});

/**
 * @desc    Get Director hierarchy (HODs and employees)
 * @route   GET /api/directors/:id/hierarchy
 * @access  Private
 */
const getHierarchy = asyncHandler(async (req, res) => {
  const hierarchy = await getDirectorHierarchy(req.params.id);
  
  res.status(200).json({
    success: true,
    data: hierarchy
  });
});

/**
 * @desc    Create new Director
 * @route   POST /api/directors
 * @access  Private (HRMS Handler, Super Admin)
 */
const createNewDirector = asyncHandler(async (req, res) => {
  const director = await createDirector(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Director created successfully',
    data: director
  });
});

/**
 * @desc    Update Director
 * @route   PUT /api/directors/:id
 * @access  Private (HRMS Handler, Super Admin)
 */
const updateDirectorById = asyncHandler(async (req, res) => {
  const director = await updateDirector(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Director updated successfully',
    data: director
  });
});

/**
 * @desc    Delete Director
 * @route   DELETE /api/directors/:id
 * @access  Private (HRMS Handler, Super Admin)
 */
const deleteDirectorById = asyncHandler(async (req, res) => {
  const result = await deleteDirector(req.params.id);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
});

/**
 * @desc    Assign HODs to Director
 * @route   POST /api/directors/:directorId/assign-hods
 * @access  Private (HRMS Handler, Super Admin)
 */
const assignHODs = asyncHandler(async (req, res) => {
  const { directorId } = req.params;
  const { hodIds } = req.body;
  
  if (!hodIds || !Array.isArray(hodIds)) {
    return res.status(400).json({
      success: false,
      message: 'hodIds must be an array'
    });
  }
  
  const results = await assignHODsToDirector(directorId, hodIds);
  
  res.status(200).json({
    success: true,
    message: `${results.success.length} HOD(s) assigned successfully`,
    data: results
  });
});

/**
 * @desc    Unassign HOD from Director
 * @route   POST /api/directors/:directorId/unassign-hod/:hodId
 * @access  Private (HRMS Handler, Super Admin)
 */
const unassignHOD = asyncHandler(async (req, res) => {
  const { directorId, hodId } = req.params;
  
  const result = await unassignHODFromDirector(directorId, hodId);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
});

/**
 * @desc    Assign employees to Director (unassigned employees)
 * @route   POST /api/directors/:directorId/assign-employees
 * @access  Private (HRMS Handler, Super Admin)
 */
const assignEmployees = asyncHandler(async (req, res) => {
  const { directorId } = req.params;
  const { employeeIds } = req.body;
  
  if (!employeeIds || !Array.isArray(employeeIds)) {
    return res.status(400).json({
      success: false,
      message: 'employeeIds must be an array'
    });
  }
  
  const results = await assignEmployeesToDirector(directorId, employeeIds);
  
  res.status(200).json({
    success: true,
    message: `${results.success.length} employee(s) assigned successfully`,
    data: results
  });
});

/**
 * @desc    Unassign employee from Director
 * @route   POST /api/directors/:directorId/unassign-employee/:employeeId
 * @access  Private (HRMS Handler, Super Admin)
 */
const unassignEmployee = asyncHandler(async (req, res) => {
  const { directorId, employeeId } = req.params;
  
  const result = await unassignEmployeeFromDirector(directorId, employeeId);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
});

/**
 * @desc    Get unassigned HODs (not assigned to any Director)
 * @route   GET /api/directors/unassigned-hods
 * @access  Private (HRMS Handler, Super Admin)
 */
const getUnassignedHODsList = asyncHandler(async (req, res) => {
  const hods = await getUnassignedHODs();
  
  res.status(200).json({
    success: true,
    count: hods.length,
    data: hods
  });
});

/**
 * @desc    Get completely unassigned employees (not under HOD or Director)
 * @route   GET /api/directors/unassigned-employees
 * @access  Private (HRMS Handler, Super Admin)
 */
const getCompletelyUnassigned = asyncHandler(async (req, res) => {
  const employees = await getCompletelyUnassignedEmployees();
  
  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees
  });
});

module.exports = {
  getDirectors,
  getDirector,
  getHierarchy,
  createNewDirector,
  updateDirectorById,
  deleteDirectorById,
  assignHODs,
  unassignHOD,
  assignEmployees,
  unassignEmployee,
  getUnassignedHODsList,
  getCompletelyUnassigned
};
