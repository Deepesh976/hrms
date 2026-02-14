const asyncHandler = require('../middleware/asyncHandler');
const {
  authenticateUser,
  updatePassword: updatePasswordService,
  createUser,
} = require('../services/authService');

const User = require('../models/User');

/* =========================================================
   LOGIN
   POST /api/auth/login
   Public
========================================================= */
const login = asyncHandler(async (req, res) => {
  const { username, password, email, phoneNo } = req.body;

  console.log('Login attempt:', { username, email, phoneNo }); // Debug log

  // Allow username / phone / email
  const loginIdentifier = username || phoneNo || email;

  if (!loginIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username / phone / email and password are required',
    });
  }

  const result = await authenticateUser(loginIdentifier, password);

  /**
   * IMPORTANT:
   * result.user MUST include mustChangePassword
   */
  res.status(200).json({
    success: true,
    token: result.token,
    user: result.user,
    mustChangePassword: result.user.mustChangePassword === true,
  });
});

/* =========================================================
   UPDATE PASSWORD (USER)
   PUT /api/auth/password
   Private
========================================================= */
const updatePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters',
    });
  }

  // Service should verify currentPassword if required
  await updatePasswordService(userId, newPassword);

  // Ensure flags are updated
  await User.findByIdAndUpdate(userId, {
    mustChangePassword: false,
    passwordChangedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

/* =========================================================
   CREATE USER (ADMIN / HR)
   POST /api/auth/create-user
   Private
========================================================= */
const createNewUser = asyncHandler(async (req, res) => {
  const creator = req.user;
  const userData = req.body;

  const newUser = await createUser(userData, creator);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser,
  });
});

/* =========================================================
   GET CURRENT USER
   GET /api/auth/me
   Private
========================================================= */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password -resetToken -resetTokenExpiry')
    .populate('employeeId', 'empName contactNo department designation')
    .lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

module.exports = {
  login,
  updatePassword,
  createNewUser,
  getCurrentUser,
};