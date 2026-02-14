const User = require('../models/User');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const bcrypt = require('bcryptjs');

/**
 * Get all HODs with their assigned employee counts
 */
const getAllHODs = async () => {
  const hods = await User.find({ role: 'hod', isActive: true })
    .populate('reportsTo', 'username role')
    .sort({ username: 1 });

  return Promise.all(
    hods.map(async (hod) => {
      const count = await Employee.countDocuments({
        reportingToHOD: hod._id,
        empStatus: 'W',
      });

      return {
        _id: hod._id,
        name: hod.name || null,
        username: hod.username,
        email: hod.email,
        department: hod.department,
        assignedEmployeesCount: count,
        reportsTo: hod.reportsTo,
        isActive: hod.isActive,
        createdAt: hod.createdAt,
      };
    })
  );
};

/**
 * Get HOD by ID with full details
 */
const getHODById = async (hodId) => {
  const hod = await User.findOne({ _id: hodId, role: 'hod' })
    .populate('reportsTo', 'username role');

  if (!hod) {
    throw new Error('HOD not found');
  }

  const employees = await Employee.find({
    reportingToHOD: hodId,
    empStatus: 'W',
  });

  return {
    _id: hod._id,
    name: hod.name || null,
    username: hod.username,
    email: hod.email,
    department: hod.department,
    assignedEmployees: employees,
    assignedEmployeesCount: employees.length,
    reportsTo: hod.reportsTo,
    isActive: hod.isActive,
    createdAt: hod.createdAt,
    updatedAt: hod.updatedAt,
  };
};


/**
 * Create a new HOD
 */
const createHOD = async (hodData) => {
  const { username, name, email, department } = hodData;

  const existingHODForDept = await User.findOne({
  role: 'hod',
  department,
  isActive: true
});

if (existingHODForDept) {
  throw new Error(`HOD already exists for ${department} department`);
}


  /* =====================================================
     VALIDATION
  ===================================================== */

  if (!username) {
    throw new Error('Username is required');
  }

  // Username must be a 10-digit phone number
  if (!/^\d{10}$/.test(username)) {
    throw new Error('HOD username must be a 10-digit phone number');
  }

  if (!department) {
  throw new Error('Department is required for HOD');
}


  /* =====================================================
     UNIQUE CHECKS
  ===================================================== */

  // Check if username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Check if email already exists (optional)
  const trimmedEmail = email ? email.trim() : null;
  if (trimmedEmail) {
    const existingEmail = await User.findOne({ email: trimmedEmail });
    if (existingEmail) {
      throw new Error('Email already exists');
    }
  }

  /* =====================================================
     CREATE HOD USER
  ===================================================== */

  const hod = new User({
    name,
    username,
    phone: username,
    email: trimmedEmail,
    password: 'accord@123',          // default password
    role: 'hod',
    department,
    // assignedEmployees: [],
    isActive: true,
    mustChangePassword: true          // force password change on first login
  });

  await hod.save();
  return hod;
};

/**
 * Update HOD details
 */
const updateHOD = async (hodId, updateData) => {
  const hod = await User.findOne({ _id: hodId, role: 'hod' });

  if (!hod) {
    throw new Error('HOD not found');
  }

  const { name, username, email, department, isActive } = updateData;

  if (name !== undefined) {
  hod.name = name.trim();
}


  /* =====================================================
     UPDATE USERNAME (PHONE NUMBER ONLY)
  ===================================================== */

  if (username && username !== hod.username) {
    // Enforce phone-number-only username for HOD
    if (!/^\d{10}$/.test(username)) {
      throw new Error('HOD username must be a 10-digit phone number');
    }

    // Check uniqueness
    const existingUser = await User.findOne({
      username,
      _id: { $ne: hodId }
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    hod.username = username;
    hod.phone = username; 
  }

  /* =====================================================
     UPDATE EMAIL (OPTIONAL)
  ===================================================== */

  if (email !== undefined) {
    const trimmedEmail = email ? email.trim() : null;

    if (trimmedEmail && trimmedEmail !== hod.email) {
      const existingEmail = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: hodId }
      });

      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    hod.email = trimmedEmail;
  }

  /* =====================================================
     UPDATE ACTIVE STATUS
  ===================================================== */

  if (isActive !== undefined) {
    hod.isActive = isActive;
  }

  await hod.save();
  return hod;
};

/**
 * Delete HOD
 */
const deleteHOD = async (hodId) => {
  const hod = await User.findOne({ _id: hodId, role: 'hod' });

  if (!hod) {
    const err = new Error('HOD not found');
    err.statusCode = 404;
    throw err;
  }

  // ✅ 1️⃣ Check assigned employees (SOURCE OF TRUTH = Employee collection)
  const employeeCount = await Employee.countDocuments({
    reportingToHOD: hodId,
    empStatus: 'W', // only working employees
  });

  if (employeeCount > 0) {
    const err = new Error(
      'Cannot delete HOD with assigned employees. Please unassign all employees first.'
    );
    err.statusCode = 409;
    throw err;
  }

  // ✅ 2️⃣ If HOD is assigned to a Director, unlink it
  if (hod.reportsTo) {
    await User.findByIdAndUpdate(hod.reportsTo, {
      $pull: { assignedHODs: hodId },
    });
  }

  // ✅ 4️⃣ Delete HOD user
  await User.findByIdAndDelete(hodId);

  return { message: 'HOD deleted successfully' };
};



/**
 * Assign employees to HOD
 * RULE:
 * - Any HOD can assign any employee (no department restriction)
 * - Employee can belong to only ONE HOD at a time
 * - Source of truth = Employee.reportingToHOD
 */
const assignEmployeesToHOD = async (hodId, employeeIds) => {
  const hod = await User.findOne({ _id: hodId, role: 'hod', isActive: true });

  if (!hod) {
    throw new Error('HOD not found');
  }

  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw new Error('Employee IDs must be a non-empty array');
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const empId of employeeIds) {
    try {
      const employee = await Employee.findById(empId);

      // ❌ Employee not found
      if (!employee) {
        results.failed.push({
          empId,
          reason: 'Employee not found',
        });
        continue;
      }

      // ❌ Already assigned to another HOD
      if (
        employee.reportingToHOD &&
        employee.reportingToHOD.toString() !== hodId
      ) {
        const existingHOD = await User.findById(employee.reportingToHOD);

        results.failed.push({
          empId,
          empName: employee.empName,
          reason: `Already assigned to HOD: ${
            existingHOD?.name || existingHOD?.username || 'Unknown'
          }`,
        });
        continue;
      }

      // ✅ ASSIGN EMPLOYEE
      employee.reportingToHOD = hodId;
      employee.reportingToDirector = null; // remove director link if any
      await employee.save();

      results.success.push({
        empId: employee._id,
        empName: employee.empName,
      });

    } catch (err) {
      results.failed.push({
        empId,
        reason: err.message,
      });
    }
  }

  return results;
};


/**
 * Unassign employee from HOD
 */
const unassignEmployeeFromHOD = async (hodId, employeeId) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new Error('Employee not found');
  }

  if (
    !employee.reportingToHOD ||
    employee.reportingToHOD.toString() !== hodId
  ) {
    throw new Error('Employee is not assigned to this HOD');
  }

  employee.reportingToHOD = null;
  await employee.save();

  return { message: 'Employee unassigned successfully' };
};


/**
 * Get unassigned employees (not assigned to any HOD)
 */
const getUnassignedEmployees = async () => {
  return await Employee.find({
    reportingToHOD: null,
    empStatus: 'W',
  }).sort({ empName: 1 });
};


/**
 * Get employees assigned to a specific HOD
 */
const getHODEmployees = async (hodId) => {
  return await Employee.find({
    reportingToHOD: hodId,
    empStatus: 'W',
  }).sort({ empName: 1 });
};



module.exports = {
  getAllHODs,
  getHODById,
  createHOD,
  updateHOD,
  deleteHOD,
  assignEmployeesToHOD,
  unassignEmployeeFromHOD,
  getUnassignedEmployees,
  getHODEmployees
};

