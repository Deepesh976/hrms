const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lg_secret_key';

/* =========================================================
   CREATE HRMS HANDLER (SUPER ADMIN ONLY)
   POST /api/admin/create
   👉 Stored in USERS collection
========================================================= */
exports.createAdmin = async (req, res) => {
  try {
    // 🔐 Only super admin
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin only.',
      });
    }

    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // 🔍 Check in USERS collection
    const existing = await User.findOne({
      $or: [{ username: email }, { email }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // ✅ Create HRMS Handler as USER
    const user = await User.create({
      username: username || email,
      email,
      password,
      role: 'hrms_handler',        // 🔒 FORCE ROLE
      isActive: true,
      mustChangePassword: true,    // 🔑 first login change
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'HRMS Handler created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('❌ createAdmin error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating HRMS Handler',
    });
  }
};

/* =========================================================
   GET ALL HRMS HANDLERS (SUPER ADMIN ONLY)
   GET /api/admin/all
   👉 Reads from USERS collection
========================================================= */
exports.getAllAdmins = async (req, res) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin only.',
      });
    }

    const admins = await User.find({ role: 'hrms_handler' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      admins,
    });
  } catch (err) {
    console.error('❌ getAllAdmins error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching HRMS Handlers',
    });
  }
};

/* =========================================================
   DELETE HRMS HANDLER (SUPER ADMIN ONLY)
   DELETE /api/admin/:id
========================================================= */
exports.deleteAdmin = async (req, res) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin only.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'hrms_handler') {
      return res.status(400).json({
        success: false,
        message: 'Only HRMS Handlers can be deleted',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'HRMS Handler deleted successfully',
    });
  } catch (err) {
    console.error('❌ deleteAdmin error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting HRMS Handler',
    });
  }
};

/* =========================================================
   LOGIN (SUPER ADMIN / HRMS HANDLER)
   👉 Uses USERS collection
   POST /api/admin/login
========================================================= */
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required',
      });
    }

    const user = await User.findOne({
      $or: [{ email }, { username: email }],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // 🔑 JWT MUST contain role
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    console.error('❌ loginAdmin error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

/* =========================================================
   GET LOGGED-IN USER PROFILE
   GET /api/admin/me
========================================================= */
exports.getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('❌ getAdminProfile error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
