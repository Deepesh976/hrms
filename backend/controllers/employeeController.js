  const asyncHandler = require('../middleware/asyncHandler');
  const {
    createEmployee: createEmployeeService,
    createMultipleEmployees,
    getAllEmployees: getAllEmployeesService,
    deleteEmployees: deleteEmployeesService,
    getEmployeeById: getEmployeeByIdService,
    updateEmployee: updateEmployeeService,
    checkEmployeeExists,
  } = require('../services/employeeService');

  const { filterEmployeeData } = require('../utils/dataFilters');
  const Employee = require('../models/Employee');

  /**
   * @desc    Create a single employee
   * @route   POST /api/employees
   * @access  Private (Admin only)
   */
  const createEmployee = asyncHandler(async (req, res) => {
    const employee = await createEmployeeService(req.body);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee,
    });
  });

  /**
   * @desc    Upload multiple employees
   * @route   POST /api/employees/upload
   * @access  Private (Admin only)
   */
  const uploadEmployees = asyncHandler(async (req, res) => {
    const { employees } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No employee data provided',
      });
    }

    const result = await createMultipleEmployees(employees);

    res.status(200).json({
      success: true,
      message: 'Employees uploaded successfully',
      insertedCount: result.insertedCount,
      skippedCount: result.skippedCount,
    });
  });

  /**
   * @desc    Get all employees (role-based)
   * @route   GET /api/employees
   * @access  Private
   */
  const getAllEmployees = asyncHandler(async (req, res) => {
    const { role, id: userId, employeeId } = req.user;

    let employees = [];

    if (role === 'super_admin' || role === 'hrms_handler') {
      employees = await Employee.find({}).sort({ empName: 1 });
    } 
    else if (role === 'director' || role === 'hod') {
      const { getReportingEmployees } = require('../services/hierarchyService');
      employees = await getReportingEmployees(userId, role);
    } 
  else if (role === 'employee') {
    if (employeeId) {
      const emp = await Employee.findById(employeeId);
      employees = emp ? [emp] : [];
    } 
    else if (req.user.empId) {
      const emp = await Employee.findOne({ empId: req.user.empId });
      employees = emp ? [emp] : [];
    }
  }


    employees = filterEmployeeData(employees, role);
    res.status(200).json(employees);
  });

  /**
   * @desc    Get logged-in employee profile (SELF)
   * @route   GET /api/employees/me
   * @access  Private (Employee only)
   */
  const getMyProfile = asyncHandler(async (req, res) => {
    const { role, employeeId, empId } = req.user;

    if (role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Only employees can access profile',
      });
    }

    let employee = null;

    // 1️⃣ Primary — ObjectId
    if (employeeId) {
      employee = await Employee.findById(employeeId);
    }

    // 2️⃣ Fallback — empId string
    if (!employee && empId) {
      employee = await Employee.findOne({ empId });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found',
      });
    }

    res.status(200).json(employee);
  });


  /**
   * @desc    Delete employees by IDs
   * @route   POST /api/employees/delete
   * @access  Private (Admin only)
   */
  const deleteEmployees = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No employee IDs provided',
      });
    }

    const deletedCount = await deleteEmployeesService(ids);

    res.status(200).json({
      success: true,
      message: `${deletedCount} employees deleted`,
    });
  });

  /**
   * @desc    Get employee by MongoDB ID
   * @route   GET /api/employees/:id
   * @access  Private
   */
  const getEmployeeById = asyncHandler(async (req, res) => {
    const { role, id: userId, employeeId } = req.user;
    const targetEmployeeId = req.params.id;

    let employee = await getEmployeeByIdService(targetEmployeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    let canAccess = false;

    if (role === 'super_admin' || role === 'hrms_handler') {
      canAccess = true;
    } 
    else if (role === 'director' || role === 'hod') {
      const { getReportingEmployees } = require('../services/hierarchyService');
      const reportingEmployees = await getReportingEmployees(userId, role);
      canAccess = reportingEmployees.some(
        (emp) => emp._id.toString() === targetEmployeeId
      );
    } 
  else if (role === 'employee') {
    // 1️⃣ Primary check via employeeId (ObjectId)
    if (employeeId && employeeId.toString() === targetEmployeeId) {
      canAccess = true;
    }

    // 2️⃣ Fallback check via empId string
    if (!canAccess && req.user.empId) {
      canAccess = employee.empId === req.user.empId;
    }
  }


    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this employee',
      });
    }

    employee = filterEmployeeData(employee, role);
    res.status(200).json(employee);
  });

  /**
   * @desc    Update employee by MongoDB ID
   * @route   PUT /api/employees/:id
   * @access  Private (Admin only)
   */
  const updateEmployeeById = asyncHandler(async (req, res) => {
    const updated = await updateEmployeeService(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Employee updated',
      employee: updated,
    });
  });

  /**
   * @desc    Check if employee ID exists
   * @route   GET /api/employees/check-empid
   * @access  Private
   */
  const checkEmpIdExists = asyncHandler(async (req, res) => {
    const { empId } = req.query;

    if (!empId) {
      return res
        .status(400)
        .json({ exists: false, message: 'empId is required' });
    }

    const exists = await checkEmployeeExists(empId);
    res.status(200).json({ exists });
  });

  /**
   * @desc    Get employees assigned to HOD
   * @route   GET /api/employees/my-department
   * @access  Private (HOD only)
   */
  const getMyDepartmentEmployees = asyncHandler(async (req, res) => {
    const { role, id: userId } = req.user;

    if (role !== 'hod') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only accessible to HODs',
      });
    }

    const { getReportingEmployees } = require('../services/hierarchyService');
    let employees = await getReportingEmployees(userId, role);

    if (!employees || employees.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No employees assigned to you yet',
        totalEmployees: 0,
        employees: [],
      });
    }

    employees = filterEmployeeData(employees, role);

    const departmentGroups = {};
    employees.forEach((emp) => {
      const dept = emp.department || 'Unassigned';
      if (!departmentGroups[dept]) {
        departmentGroups[dept] = [];
      }
      departmentGroups[dept].push(emp);
    });

    const departmentSummary = Object.keys(departmentGroups).map(
      (dept) => ({
        department: dept,
        employeeCount: departmentGroups[dept].length,
      })
    );

    res.status(200).json({
      success: true,
      totalEmployees: employees.length,
      departmentSummary,
      employees,
    });
  });

  module.exports = {
    createEmployee,
    uploadEmployees,
    getAllEmployees,
    getMyProfile,
    deleteEmployees,
    getEmployeeById,
    updateEmployeeById,
    checkEmpIdExists,
    getMyDepartmentEmployees,
  };
