const User = require('../models/User');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');

/**
 * Get all Directors with their assigned HOD and employee counts
 */
const getAllDirectors = async () => {
  const directors = await User.find({ role: 'director', isActive: true })
    .populate('employeeId', 'empId empName department designation')
    .populate('assignedHODs', 'username email')
    .populate('assignedDirectEmployees', 'empId empName department designation')
    .sort({ username: 1 });

  return directors.map(director => ({
    _id: director._id,
    name: director.name || director.employeeId?.empName || null,
    username: director.username,
    email: director.email,
    employeeInfo: director.employeeId,
    assignedHODsCount: director.assignedHODs?.length || 0,
    assignedHODs: director.assignedHODs || [],
    assignedEmployeesCount: director.assignedDirectEmployees?.length || 0,
    assignedEmployees: director.assignedDirectEmployees || [],
    isActive: director.isActive,
    createdAt: director.createdAt
  }));
};

/**
 * Get Director by ID with full details
 */
const getDirectorById = async (directorId) => {
  const director = await User.findOne({ _id: directorId, role: 'director' })
    .populate('employeeId', 'empId empName department designation officialEmail contactNo')
    .populate({
      path: 'assignedHODs',
      select: 'username email employeeId assignedEmployees',
      populate: [
        { path: 'employeeId', select: 'empId empName department' },
        { path: 'assignedEmployees', select: 'empId empName department' }
      ]
    })
    .populate('assignedDirectEmployees', 'empId empName department designation officialEmail contactNo');

  if (!director) {
    throw new Error('Director not found');
  }

  return {
    _id: director._id,
    name: director.name || director.employeeId?.empName || null,
    username: director.username,
    email: director.email,
    employeeInfo: director.employeeId,
    assignedHODs: director.assignedHODs || [],
    assignedHODsCount: director.assignedHODs?.length || 0,
    assignedEmployees: director.assignedDirectEmployees || [],
    assignedEmployeesCount: director.assignedDirectEmployees?.length || 0,
    isActive: director.isActive,
    createdAt: director.createdAt,
    updatedAt: director.updatedAt
  };
};

/**
 * Create a new Director
 * Same behaviour as HOD:
 * - Default password: accord@123
 * - mustChangePassword: true
 */
const createDirector = async (directorData) => {
  const { name, username, email, employeeId } = directorData;

  // ✅ Validation
  if (!name || !username) {
    throw new Error('Name and username are required');
  }

  // ✅ Username uniqueness
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // ✅ Email uniqueness (optional)
  if (email) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new Error('Email already exists');
    }
  }

  // ✅ Employee validation
  let employee = null;
  if (employeeId) {
    employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const existingUserWithEmployee = await User.findOne({ employeeId });
    if (existingUserWithEmployee) {
      throw new Error('This employee already has a user account');
    }
  }

  // ✅ Create Director (NO password from UI)
  const director = new User({
    name: name.trim(),
    username,
    phone: /^\d{10}$/.test(username) ? username : null,
    email: email || null,
    password: 'accord@123',          // 🔑 default password
    role: 'director',
    employeeId: employeeId || null,
    assignedHODs: [],
    assignedDirectEmployees: [],
    isActive: true,
    mustChangePassword: true          // 🔁 force change on first login
  });

  await director.save();

  // ✅ Link employee → user
  if (employee) {
    employee.userId = director._id;
    await employee.save();
  }

  return director;
};

/**
 * Update Director details
 */
const updateDirector = async (directorId, updateData) => {
  const director = await User.findOne({ _id: directorId, role: 'director' });
  
  if (!director) {
    throw new Error('Director not found');
  }

  const { name, username, email, password, employeeId, isActive } = updateData;

  if (name !== undefined) {
  director.name = name.trim();
}


  // Check if new username conflicts
  if (username && username !== director.username) {
    const existingUser = await User.findOne({ username, _id: { $ne: directorId } });
    if (existingUser) {
      throw new Error('Username already exists');
    }
    director.username = username;
  }

  // Check if new email conflicts
  if (email && email !== director.email) {
    const existingEmail = await User.findOne({ email, _id: { $ne: directorId } });
    if (existingEmail) {
      throw new Error('Email already exists');
    }
    director.email = email;
  }

  // Update password if provided
// Update password if provided (optional)
if (password) {
  director.password = password;
  director.passwordChangedAt = new Date();
  director.mustChangePassword = false; // ✅ reset after manual change
}


  // Update employee link if provided
  if (employeeId !== undefined) {
    // Remove old employee link if exists
    if (director.employeeId) {
      const oldEmployee = await Employee.findById(director.employeeId);
      if (oldEmployee) {
        oldEmployee.userId = null;
        await oldEmployee.save();
      }
    }

    // Add new employee link
    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if employee already has a user account
      const existingUserWithEmployee = await User.findOne({ 
        employeeId, 
        _id: { $ne: directorId } 
      });
      if (existingUserWithEmployee) {
        throw new Error('This employee already has a user account');
      }

      employee.userId = director._id;
      await employee.save();
      director.employeeId = employeeId;
    } else {
      director.employeeId = null;
    }
  }

  if (isActive !== undefined) {
    director.isActive = isActive;
  }

  await director.save();
  return director;
};

/**
 * Delete Director
 */
const deleteDirector = async (directorId) => {
  // 1️⃣ Find director
  const director = await User.findOne({ _id: directorId, role: 'director' });

  if (!director) {
    const err = new Error('Director not found');
    err.statusCode = 404;
    throw err;
  }

  // 2️⃣ Check assigned HODs (User is source of truth)
  if (Array.isArray(director.assignedHODs) && director.assignedHODs.length > 0) {
    const err = new Error(
      'Cannot delete Director with assigned HODs. Please unassign all HODs first.'
    );
    err.statusCode = 409;
    throw err;
  }

  // 3️⃣ Check assigned DIRECT employees (Employee is source of truth)
  const directEmployeeCount = await Employee.countDocuments({
    reportingToDirector: directorId,
    empStatus: 'W', // only working employees
  });

  if (directEmployeeCount > 0) {
    const err = new Error(
      'Cannot delete Director with assigned employees. Please unassign all employees first.'
    );
    err.statusCode = 409;
    throw err;
  }

  // 4️⃣ Unlink director's own employee account (if linked)
  if (director.employeeId) {
    await Employee.findByIdAndUpdate(
      director.employeeId,
      { $set: { userId: null } },
      { new: true }
    );
  }

  // 5️⃣ Delete director user
  await User.findByIdAndDelete(directorId);

  return { message: 'Director deleted successfully' };
};

/**
 * Assign HODs to Director
 */
const assignHODsToDirector = async (directorId, hodIds) => {
  const director = await User.findOne({ _id: directorId, role: 'director' });
  
  if (!director) {
    throw new Error('Director not found');
  }

  if (!Array.isArray(hodIds) || hodIds.length === 0) {
    throw new Error('HOD IDs must be a non-empty array');
  }

  const results = {
    success: [],
    failed: []
  };

  for (const hodId of hodIds) {
    try {
      const hod = await User.findOne({ _id: hodId, role: 'hod' });
      
      if (!hod) {
        results.failed.push({ hodId, reason: 'HOD not found' });
        continue;
      }

      // Check if HOD is already assigned to another Director
      if (hod.reportsTo && hod.reportsTo.toString() !== directorId) {
        const existingDirector = await User.findById(hod.reportsTo);
        results.failed.push({ 
          hodId, 
          hodName: hod.username,
          reason: `Already assigned to Director: ${existingDirector?.username || 'Unknown'}` 
        });
        continue;
      }

      // Assign HOD to Director
      hod.reportsTo = directorId;
      await hod.save();

      // Add to Director's assigned HODs if not already there
      if (!director.assignedHODs.includes(hodId)) {
        director.assignedHODs.push(hodId);
      }

      results.success.push({ 
        hodId: hod._id, 
        hodName: hod.username 
      });
    } catch (error) {
      results.failed.push({ hodId, reason: error.message });
    }
  }

  await director.save();

  return results;
};

/**
 * Unassign HOD from Director
 */
const unassignHODFromDirector = async (directorId, hodId) => {
  const director = await User.findOne({ _id: directorId, role: 'director' });
  
  if (!director) {
    throw new Error('Director not found');
  }

  const hod = await User.findOne({ _id: hodId, role: 'hod' });
  
  if (!hod) {
    throw new Error('HOD not found');
  }

  // Check if HOD is actually assigned to this Director
  if (!hod.reportsTo || hod.reportsTo.toString() !== directorId) {
    throw new Error('HOD is not assigned to this Director');
  }

  // Remove assignment
  hod.reportsTo = null;
  await hod.save();

  // Remove from Director's assigned HODs array
  director.assignedHODs = director.assignedHODs.filter(
    id => id.toString() !== hodId
  );
  await director.save();

  return { message: 'HOD unassigned successfully' };
};

/**
 * Assign employees directly to Director (for employees not under any HOD)
 */
const assignEmployeesToDirector = async (directorId, employeeIds) => {
  const director = await User.findOne({ _id: directorId, role: 'director' });
  
  if (!director) {
    throw new Error('Director not found');
  }

  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw new Error('Employee IDs must be a non-empty array');
  }

  const results = {
    success: [],
    failed: []
  };

  for (const empId of employeeIds) {
    try {
      const employee = await Employee.findById(empId);
      
      if (!employee) {
        results.failed.push({ empId, reason: 'Employee not found' });
        continue;
      }

      // Check if employee is already assigned to an HOD
      if (employee.reportingToHOD) {
        const hod = await User.findById(employee.reportingToHOD);
        results.failed.push({ 
          empId, 
          empName: employee.empName,
          reason: `Already assigned to HOD: ${hod?.username || 'Unknown'}` 
        });
        continue;
      }

      // Check if employee is already assigned to another Director
      if (employee.reportingToDirector && employee.reportingToDirector.toString() !== directorId) {
        const existingDirector = await User.findById(employee.reportingToDirector);
        results.failed.push({ 
          empId, 
          empName: employee.empName,
          reason: `Already assigned to Director: ${existingDirector?.username || 'Unknown'}` 
        });
        continue;
      }

      // Assign employee to Director
      employee.reportingToDirector = directorId;
      await employee.save();

      // Add to Director's assigned employees if not already there
      if (!director.assignedDirectEmployees.includes(empId)) {
        director.assignedDirectEmployees.push(empId);
      }

      results.success.push({ 
        empId: employee._id, 
        empName: employee.empName 
      });
    } catch (error) {
      results.failed.push({ empId, reason: error.message });
    }
  }

  await director.save();

  return results;
};

/**
 * Unassign employee from Director
 */
const unassignEmployeeFromDirector = async (directorId, employeeId) => {
  const director = await User.findOne({ _id: directorId, role: 'director' });
  
  if (!director) {
    throw new Error('Director not found');
  }

  const employee = await Employee.findById(employeeId);
  
  if (!employee) {
    throw new Error('Employee not found');
  }

  // Check if employee is actually assigned to this Director
  if (!employee.reportingToDirector || employee.reportingToDirector.toString() !== directorId) {
    throw new Error('Employee is not assigned to this Director');
  }

  // Remove assignment
  employee.reportingToDirector = null;
  await employee.save();

  // Remove from Director's assigned employees array
  director.assignedDirectEmployees = director.assignedDirectEmployees.filter(
    id => id.toString() !== employeeId
  );
  await director.save();

  return { message: 'Employee unassigned successfully' };
};

/**
 * Get unassigned HODs (not assigned to any Director)
 */
const getUnassignedHODs = async () => {
  const hods = await User.find({
    role: 'hod',
    reportsTo: null,
    isActive: true
  })
    .populate('employeeId', 'empId empName')
    .populate('assignedEmployees', 'empId empName')
    .sort({ username: 1 });

  return hods;
};

/**
 * Get completely unassigned employees (not assigned to any HOD or Director)
 */
const getCompletelyUnassignedEmployees = async () => {
  const employees = await Employee.find({
    reportingToHOD: null,
    reportingToDirector: null,
    empStatus: 'W' // Only working employees
  }).sort({ empName: 1 });

  return employees;
};

/**
 * Get Director's hierarchy (all HODs and their employees + direct employees)
 */
const getDirectorHierarchy = async (directorId) => {
  const director = await User.findOne({ _id: directorId, role: 'director' })
    .populate({
      path: 'assignedHODs',
      select: 'username email employeeId assignedEmployees',
      populate: [
        { path: 'employeeId', select: 'empId empName department designation' },
        { path: 'assignedEmployees', select: 'empId empName department designation officialEmail' }
      ]
    })
    .populate('assignedDirectEmployees', 'empId empName department designation officialEmail');

  if (!director) {
    throw new Error('Director not found');
  }

  // Calculate total employees under this director
  let totalEmployees = director.assignedDirectEmployees?.length || 0;
  
  const hodsWithEmployees = (director.assignedHODs || []).map(hod => {
    const empCount = hod.assignedEmployees?.length || 0;
    totalEmployees += empCount;
    return {
      _id: hod._id,
      username: hod.username,
      email: hod.email,
      employeeInfo: hod.employeeId,
      assignedEmployees: hod.assignedEmployees || [],
      employeeCount: empCount
    };
  });

  return {
    director: {
      _id: director._id,
      name: director.name || director.employeeId?.empName || null,
      username: director.username,
      email: director.email,
      employeeInfo: director.employeeId
    },
    assignedHODs: hodsWithEmployees,
    directEmployees: director.assignedDirectEmployees || [],
    totalHODs: hodsWithEmployees.length,
    totalEmployees
  };
};

module.exports = {
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
};

