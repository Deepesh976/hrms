const express = require('express');
const router = express.Router();

const {
  login,
  updatePassword,
  createNewUser,
  getCurrentUser,
} = require('../controllers/authController');

const {
  protect,
  requireAdmin,
} = require('../middleware/authMiddleware');

const User = require('../models/User');

/* =========================================================
   🔐 AUTH ROUTES
========================================================= */

/**
 * @route   POST /api/auth/login
 * @desc    Login user (phone for employees, username/email for admins)
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   PUT /api/auth/password
 * @desc    Update own password
 * @access  Private
 */
router.put('/password', protect, updatePassword);

/**
 * @route   PUT /api/auth/update-password (legacy support)
 * @desc    Update own password
 * @access  Private
 */
router.put('/update-password', protect, updatePassword);

/* =========================================================
   🚀 SUPER ADMIN BOOTSTRAP (SAFE)
========================================================= */
/**
 * @route   POST /api/auth/create-user
 * @desc    Create first Super Admin (ONLY if none exists)
 *           After first super_admin is created, this route
 *           becomes Admin-only automatically.
 * @access  Conditional
 */
router.post('/create-user', async (req, res, next) => {
  try {
    const superAdminExists = await User.exists({ role: 'super_admin' });

    // ✅ If no super admin exists → allow bootstrap
    if (!superAdminExists) {
      return createNewUser(req, res);
    }

    // 🔐 Otherwise require admin auth
    return protect(req, res, () =>
      requireAdmin(req, res, () => createNewUser(req, res))
    );
  } catch (err) {
    console.error('❌ Create User Route Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating user',
    });
  }
});

module.exports = router;
