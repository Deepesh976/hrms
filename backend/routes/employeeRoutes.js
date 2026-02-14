const express = require('express');
const router = express.Router();
const {
  createEmployee,
  uploadEmployees,
  getAllEmployees,
  deleteEmployees,
  getEmployeeById,
  updateEmployeeById,
  checkEmpIdExists,
  getMyDepartmentEmployees,
  getMyProfile          // ✅ NEW
} = require('../controllers/employeeController');
const { 
  protect, 
  authorizeRoles, 
  authorizeDepartment, 
  requireAdmin 
} = require('../middleware/authMiddleware');

// Optional: Validate controller functions (dev-time check)
if (
  typeof createEmployee !== 'function' ||
  typeof uploadEmployees !== 'function' ||
  typeof getAllEmployees !== 'function' ||
  typeof deleteEmployees !== 'function' ||
  typeof getEmployeeById !== 'function' ||
  typeof updateEmployeeById !== 'function' ||
  typeof checkEmpIdExists !== 'function' ||
  typeof getMyDepartmentEmployees !== 'function' ||
  typeof getMyProfile !== 'function'          // ✅ NEW CHECK
) {
  throw new Error('❌ One or more employeeController exports are missing or not functions');
}

// ✅ Protected Routes with Role-Based Access

/**
 * Create a single employee (Admin only)
 * Super Admin & HRMS Handler can create employee data
 */
router.post('/', 
  protect, 
  requireAdmin,
  createEmployee
);

/**
 * Upload employees (Admin only)
 * Super Admin & HRMS Handler can upload employee data
 */
router.post('/upload', 
  protect, 
  requireAdmin,
  uploadEmployees
);

/**
 * Get all employees (All except employee role)
 * Data will be filtered in controller based on role
 */
router.get('/', 
  protect, 
  authorizeRoles('super_admin', 'hrms_handler', 'director', 'hod', 'admin', 'superadmin'),
  authorizeDepartment,
  getAllEmployees
);

/**
 * Get logged-in employee profile (SELF)
 * ⚠️ MUST be before /:id
 */
router.get(
  '/me',
  protect,
  authorizeRoles('employee'),
  getMyProfile
);

/**
 * Get employees under HOD's departments (HOD only)
 */
router.get('/my-department', 
  protect, 
  authorizeRoles('hod'),
  getMyDepartmentEmployees
);

/**
 * Check if empId exists (Admin only)
 */
router.get('/check-empid', 
  protect, 
  requireAdmin,
  checkEmpIdExists
);

/**
 * Get employee by ID
 * Access based on role (director/hod can view, employee only own)
 */
router.get('/:id', 
  protect,
  authorizeRoles(
    'super_admin',
    'hrms_handler',
    'director',
    'hod',
    'employee',
    'admin',
    'superadmin'
  ),
  getEmployeeById
);

/**
 * Update employee (Admin only)
 */
router.put('/:id', 
  protect, 
  requireAdmin,
  updateEmployeeById
);

/**
 * Delete employees (Admin only)
 */
router.post('/delete', 
  protect, 
  requireAdmin,
  deleteEmployees
);

/**
 * Delete all employees (Super Admin only - for dev/reset purposes)
 */
router.delete('/all', 
  protect,
  authorizeRoles('super_admin', 'superadmin', 'hrms', 'hrms_handler'),
  async (req, res) => {
    try {
      const Employee = require('../models/Employee');
      const result = await Employee.deleteMany({});
      res.status(200).json({ 
        success: true,
        message: `${result.deletedCount} employees removed` 
      });
    } catch (err) {
      console.error('❌ Delete All Error:', err.message);
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete all employees' 
      });
    }
  }
);

module.exports = router;
