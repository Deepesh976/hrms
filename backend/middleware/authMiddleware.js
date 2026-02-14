const jwt = require('jsonwebtoken');
const { ROLES } = require('../utils/rolePermissions');
const Employee = require('../models/Employee');

/**
 * 🔐 Protect routes - Verify JWT token
 */
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * 🔥 SINGLE SOURCE OF TRUTH
     * empId      → STRING (used for attendance, ownership)
     * employeeId → ObjectId (used for profile, fallback)
     */
    req.user = {
      id: decoded.id,
      username: decoded.username || null,
      role: decoded.role,
      name: decoded.name || null,
      empId: decoded.empId || null,                 // STRING
      employeeId: decoded.employeeObjectId || null, // OBJECT ID
    };

    next();
  } catch (err) {
    console.error('JWT verify error:', err);
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired token.',
    });
  }
};

/**
 * 🎭 Authorize specific roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'User information missing',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed`,
      });
    }

    next();
  };
};

/**
 * 🔥 HIERARCHY-BASED ACCESS CONTROL
 * Builds req.activityFilter
 */
const authorizeDepartment = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const { role } = req.user;

  /* ============================
     🔓 FULL ACCESS ROLES
  ============================ */
  if ([ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER].includes(role)) {
    req.activityFilter = {};
    return next();
  }

  /* ============================
     👤 EMPLOYEE → OWN DATA ONLY
     🔥 FIXED WITH FALLBACK
  ============================ */
  if (role === ROLES.EMPLOYEE) {
    // 1️⃣ Primary: empId from JWT
    if (req.user.empId) {
      req.activityFilter = { empId: req.user.empId };
      return next();
    }

    // 2️⃣ Fallback: resolve empId from employeeId (ObjectId)
    if (req.user.employeeId) {
      const employee = await Employee.findById(req.user.employeeId).select('empId');

      if (employee && employee.empId) {
        req.activityFilter = { empId: employee.empId };
        return next();
      }
    }

    // 3️⃣ Truly unlinked
    return res.status(403).json({
      success: false,
      message: 'Employee account not linked',
    });
  }

  /* ============================
     👔 HOD → ASSIGNED EMPLOYEES
  ============================ */
  if (role === ROLES.HOD) {
    const employees = await Employee.find({
      reportingToHOD: req.user.id,
      empStatus: 'W',
    }).select('empId');

    req.activityFilter = {
      empId: { $in: employees.map((e) => e.empId) },
    };

    return next();
  }

  /* ============================
     🎯 DIRECTOR → HIERARCHY (Direct + HOD Reports)
  ============================ */
  if (role === ROLES.DIRECTOR) {
    // Step 1: Find all HODs reporting to this director
    const User = require('../models/User');
    const hods = await User.find({
      reportsTo: req.user.id,
      role: 'hod',
      isActive: true,
    }).select('_id');

    const hodIds = hods.map(h => h._id);

    // Step 2: Find employees - both direct reports and those under HODs
    const employees = await Employee.find({
      $or: [
        { reportingToDirector: req.user.id },  // Direct reports to director
        { reportingToHOD: { $in: hodIds } }    // Reports to HODs under this director
      ],
      empStatus: 'W',
    }).select('empId');

    req.activityFilter = {
      empId: { $in: employees.map((e) => e.empId) },
    };

    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied',
  });
};

/**
 * 🔒 Ownership check
 * EMPLOYEE can access only own data
 */
const authorizeOwnership = (paramName = 'empId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { role, empId } = req.user;

    if (role === ROLES.EMPLOYEE) {
      const targetEmpId =
        req.params[paramName] ||
        req.body.empId ||
        req.query.empId;

      if (targetEmpId && targetEmpId !== empId) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own data',
        });
      }
    }

    next();
  };
};

/**
 * 🛡 Admin only
 */
const requireAdmin = (req, res, next) => {
  if (![ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

/**
 * 👑 Super Admin only
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Super Admin access required',
    });
  }
  next();
};

module.exports = {
  protect,
  authorizeRoles,
  authorizeDepartment,
  authorizeOwnership,
  requireAdmin,
  requireSuperAdmin,
};
