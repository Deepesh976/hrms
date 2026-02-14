const Employee = require('../models/Employee');
const User = require('../models/User');

const { 
  normalizeEmpId, 
  formatPhoneNumber, 
  formatBankAccount, 
  normalizeGender,
  safe
} = require('../utils/helpers');

// Leave service integration
let leaveService;
try {
  leaveService = require('./leaveService');
} catch (error) {
  console.warn('⚠️  Leave service not available for employee integration');
}

/**
 * Normalize and validate employee data
 * @param {Object} employeeData - Raw employee data
 * @returns {Object} - Normalized employee data
 */
const normalizeEmployeeData = (employeeData) => {
  const normalized = { ...employeeData };

  if (normalized.empId) {
    normalized.empId = normalizeEmpId(normalized.empId);
  }

  if (normalized.empName) {
    normalized.empName = String(normalized.empName).trim();
  }

  if (normalized.empUnit) {
    normalized.empUnit = String(normalized.empUnit).trim();
  }

  // Format phone numbers
  if (normalized.contactNo) {
    normalized.contactNo = formatPhoneNumber(normalized.contactNo);
  }

  if (normalized.emergencyContact) {
    normalized.emergencyContact = formatPhoneNumber(normalized.emergencyContact);
  }

  // Format bank account
  if (normalized.bankAccount) {
    normalized.bankAccount = formatBankAccount(normalized.bankAccount);
  }

  // Normalize gender
  if (normalized.gender) {
    normalized.gender = normalizeGender(normalized.gender);
  }

  // Convert numeric fields
  const numberFields = ['settlementAmount', 'hiredCtc', 'joiningCtc', 'ctc2025', 'yearsWorked'];
  numberFields.forEach(field => {
    if (normalized[field] !== undefined && normalized[field] !== '') {
      normalized[field] = safe(normalized[field]);
    }
  });

  return normalized;
};

/**
 * Create a single employee
 * @param {Object} employeeData - Employee data
 * @returns {Promise<Object>} - Created employee
 */
const createEmployee = async (employeeData) => {
  // Normalize data
  const normalized = normalizeEmployeeData(employeeData);

  // Validate required fields
  if (!normalized.empId || !normalized.empName || !normalized.empUnit) {
    throw new Error('Missing required fields: empId, empName, and empUnit are required');
  }

  // Check if employee with same empId already exists
  const existing = await Employee.findOne({ empId: normalized.empId });
  if (existing) {
    throw new Error(`Employee with empId ${normalized.empId} already exists`);
  }

const employee = new Employee({
  ...normalized,
  userId: null
});

const savedEmployee = await employee.save();

/* =====================================================
   🔥 AUTO-CREATE USER FOR EMPLOYEE
===================================================== */
if (savedEmployee.contactNo) {
  const existingUser = await User.findOne({
    $or: [
      { employeeId: savedEmployee._id },
      { phone: savedEmployee.contactNo },
    ],
  });

  if (!existingUser) {
    const user = await User.create({
      username: savedEmployee.contactNo,
      phone: savedEmployee.contactNo,
      name: savedEmployee.empName,
      password: '123456789',
      role: 'employee',
      employeeId: savedEmployee._id,
      isActive: true,
      mustChangePassword: true,
    });

    savedEmployee.userId = user._id;
    await savedEmployee.save();
  }
}


// Initialize leave balance for new employee
  if (leaveService) {
    try {
      const currentYear = new Date().getFullYear();
      await leaveService.initializeEmployeeLeaveBalance(savedEmployee.empId, currentYear);
      console.log(`  ✅ Leave balance initialized for ${savedEmployee.empId}`);
    } catch (error) {
      console.error(`  ⚠️  Failed to initialize leave balance for ${savedEmployee.empId}:`, error.message);
    }
  }

  return savedEmployee;
};

/**
 * Create multiple employees (Excel upload safe)
 * @param {Array} employees - Array of employee data
 * @returns {Promise<Object>} - { insertedCount, skippedCount, skipped }
 */
const createMultipleEmployees = async (employees) => {
  const validEmployees = [];
  const skippedRows = [];

  // 1️⃣ Normalize & validate rows
  for (const emp of employees) {
    const normalized = normalizeEmployeeData(emp);

    if (!normalized.empId || !normalized.empName || !normalized.empUnit) {
      skippedRows.push(emp);
      continue;
    }

    validEmployees.push(normalized);
  }

  // 2️⃣ Remove null / invalid empIds
  const cleanedEmployees = validEmployees
    .filter(emp => emp.empId && emp.empId !== 'null')
    .map(emp => ({
      ...emp,
      userId: null
    }));

  if (cleanedEmployees.length === 0) {
    throw new Error('No valid employees to insert');
  }

// 3️⃣ Remove duplicates inside Excel itself
const uniqueMap = new Map();

for (const emp of cleanedEmployees) {
  const key = emp.empId;
  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, emp);
  } else {
    skippedRows.push(emp);
  }
}

const uniqueEmployees = Array.from(uniqueMap.values());


  // 4️⃣ Remove employees that already exist in DB
  const existingEmployees = await Employee.find({
    empId: { $in: uniqueEmployees.map(e => e.empId) }
  }).select('empId');

  const existingSet = new Set(existingEmployees.map(e => e.empId));

  const finalEmployees = uniqueEmployees.filter(
    emp => !existingSet.has(emp.empId)
  );

  if (finalEmployees.length === 0) {
    return {
      insertedCount: 0,
      skippedCount: skippedRows.length + existingSet.size,
      skipped: skippedRows
    };
  }

  // 5️⃣ Insert employees
  const result = await Employee.insertMany(finalEmployees, {
    ordered: false
  });

  /* =====================================================
   🔥 AUTO-CREATE USERS FOR BULK EMPLOYEES
===================================================== */
for (const emp of result) {
  if (!emp.contactNo) continue;

  const existingUser = await User.findOne({
    $or: [
      { employeeId: emp._id },
      { phone: emp.contactNo },
    ],
  });

  if (!existingUser) {
    const user = await User.create({
      username: emp.contactNo,
      phone: emp.contactNo,
      name: emp.empName,
      password: '123456789',
      role: 'employee',
      employeeId: emp._id,
      isActive: true,
      mustChangePassword: true,
    });

    emp.userId = user._id;
    await emp.save();
  }
}


  // 6️⃣ Initialize leave balances
  if (leaveService && result.length > 0) {
    const currentYear = new Date().getFullYear();

    for (const emp of result) {
      try {
        await leaveService.initializeEmployeeLeaveBalance(emp.empId, currentYear);
        console.log(`✅ Leave balance initialized for ${emp.empId}`);
      } catch (error) {
        console.error(
          `⚠️ Failed to initialize leave balance for ${emp.empId}:`,
          error.message
        );
      }
    }
  }

  return {
    insertedCount: result.length,
    skippedCount:
      skippedRows.length + (uniqueEmployees.length - finalEmployees.length),
    skipped: skippedRows
  };
};


/**
 * Get all employees
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Employees
 */
const getAllEmployees = async (filter = {}, options = {}) => {
  const { sort = { createdAt: -1 }, limit, skip } = options;
  
  let query = Employee.find(filter).sort(sort);
  
  if (skip) query = query.skip(skip);
  if (limit) query = query.limit(limit);
  
  const employees = await query;
  return employees;
};

/**
 * Get employee by ID
 * @param {string} employeeId - Employee MongoDB ID
 * @returns {Promise<Object>} - Employee data
 */
const getEmployeeById = async (employeeId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }
  return employee;
};

/**
 * Get employee by empId
 * @param {string} empId - Employee ID
 * @returns {Promise<Object>} - Employee data
 */
const getEmployeeByEmpId = async (empId) => {
  const normalizedId = normalizeEmpId(empId);
  const employee = await Employee.findOne({ empId: normalizedId });
  return employee;
};

/**
 * Update employee
 * @param {string} employeeId - Employee MongoDB ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Updated employee
 */
const updateEmployee = async (employeeId, updateData) => {
const normalized = normalizeEmployeeData(updateData);

// ❗ never allow empId change
delete normalized.empId;

  
  const updated = await Employee.findByIdAndUpdate(
    employeeId, 
    normalized, 
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new Error('Employee not found');
  }

  return updated;
};

/**
 * Delete employees by empIds
 * @param {Array} empIds - Array of employee IDs
 * @returns {Promise<number>} - Number of deleted employees
 */
const deleteEmployees = async (empIds) => {
  const normalizedIds = empIds.map(id => normalizeEmpId(id));
  const result = await Employee.deleteMany({ empId: { $in: normalizedIds } });
  return result.deletedCount;
};

/**
 * Delete employee by MongoDB ID
 * - Also deletes linked User account (if exists)
 * @param {string} employeeId - Employee MongoDB ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteEmployeeById = async (employeeId) => {
  // 1️⃣ Find employee first
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  // 2️⃣ Delete linked user account if exists
  if (employee.userId) {
    await User.findByIdAndDelete(employee.userId);
  }

  // 3️⃣ Delete employee record
  await Employee.findByIdAndDelete(employeeId);

  return true;
};

/**
 * Check if employee ID exists
 * @param {string} empId - Employee ID
 * @returns {Promise<boolean>} - Exists status
 */
const checkEmployeeExists = async (empId) => {
  const normalizedId = normalizeEmpId(empId);
  const employee = await Employee.findOne({ empId: normalizedId });
  return !!employee;
};

/**
 * Get employees by status
 * @param {string} status - Employee status (W/L)
 * @returns {Promise<Array>} - Employees
 */
const getEmployeesByStatus = async (status) => {
  return await Employee.find({ empStatus: status })
    .sort({ createdAt: -1 });
};

/**
 * Get employees by department
 * @param {string} department - Department name
 * @returns {Promise<Array>} - Employees
 */
const getEmployeesByDepartment = async (department) => {
  return await Employee.find({ department })
    .sort({ empName: 1 });
};

/**
 * Search employees by name, ID, or unit
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} - Matching employees
 */
const searchEmployees = async (searchTerm) => {
  const regex = new RegExp(searchTerm, 'i');

  return await Employee.find({
    $or: [
      { empId: regex },
      { empName: regex },
      { empUnit: regex }
    ]
  }).limit(50);
};

/**
 * Get employee count
 * @param {Object} filter - Filter criteria
 * @returns {Promise<number>} - Count
 */
const getEmployeeCount = async (filter = {}) => {
  return await Employee.countDocuments(filter);
};


module.exports = {
  normalizeEmployeeData,
  createEmployee,
  createMultipleEmployees,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByEmpId,
  updateEmployee,
  deleteEmployees,
  deleteEmployeeById,
  checkEmployeeExists,
  getEmployeesByStatus,
  getEmployeesByDepartment,
  searchEmployees,
  getEmployeeCount
};

