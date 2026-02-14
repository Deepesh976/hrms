const bcrypt = require('bcrypt');
const User = require('../models/User');
const Employee = require('../models/Employee');

const DEFAULT_PASSWORD = '123456789';

/* =========================================================
   CREATE USER
========================================================= */
exports.createUser = async (req, res) => {
  try {
    const { user_name, mobile_no, employeeId, role } = req.body;

    if (!user_name || !mobile_no) {
      return res.status(400).json({
        success: false,
        message: 'user_name and mobile_no are required',
      });
    }

    const mobileStr = String(mobile_no).trim();
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const user = new User({
      name: user_name,
      phone: mobileStr,
      employeeId: employeeId || null,
      role: role || 'employee',
      isActive: true,
      password: hashedPassword,
      mustChangePassword: true,
      passwordChangedAt: null,
    });

    const saved = await user.save();

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: saved._id,
        name: saved.name,
        phone: saved.phone,
      },
    });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* =========================================================
   LIST USERS (BASIC)
========================================================= */
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      items: users,
      total: users.length,
    });
  } catch (err) {
    console.error('listUsers error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* =========================================================
   LIST USERS FOR MANAGE PASSWORDS
   🔥 SELF-HEALING VERSION
========================================================= */
exports.listUsersWithEmployee = async (req, res) => {
  try {
    const users = await User.find({
      isActive: true,
      role: { $in: ['employee', 'hod', 'director'] },
    })
      .select('-password')
      .lean();

    const result = [];

    for (const u of users) {
      let employee = null;

      // 🔥 1️⃣ Try employeeId (future-safe)
      if (u.employeeId) {
        employee = await Employee.findById(u.employeeId)
          .select('empId empName contactNo')
          .lean();
      }

      // 🔥 2️⃣ Match using phone number
      if (!employee && (u.phone || u.username)) {
        const phoneToMatch = u.phone || u.username;

        employee = await Employee.findOne({
          contactNo: { $regex: phoneToMatch + '$' },
        })
          .select('empId empName contactNo')
          .lean();
      }

      result.push({
        _id: u._id,
        role: u.role,
        empId: employee?.empId || null,
        user_name: employee?.empName || u.name || u.username || null,
        mobile_no: employee?.contactNo || u.phone || null,
      });
    }

    return res.json({
      success: true,
      items: result,
      total: result.length,
    });
  } catch (err) {
    console.error('listUsersWithEmployee error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};


/* =========================================================
   GET USER BY ID
========================================================= */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('employeeId', 'empId empName contactNo')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error('getUserById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* =========================================================
   UPDATE USER
========================================================= */
exports.updateUser = async (req, res) => {
  try {
    const data = { ...req.body };

    delete data.password;
    delete data.mustChangePassword;
    delete data.passwordChangedAt;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error('updateUser error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* =========================================================
   SOFT DELETE
========================================================= */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* =========================================================
   RESET PASSWORD
========================================================= */
exports.resetPasswordByHR = async (req, res) => {
  try {
    const { userId } = req.params;

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
        mustChangePassword: true,
        passwordChangedAt: null,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'Password reset to default successfully',
    });
  } catch (err) {
    console.error('resetPasswordByHR error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
