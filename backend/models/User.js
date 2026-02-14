const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    /* =========================
       AUTHENTICATION
    ========================= */

    name: {
      type: String,
      trim: true,
    },

    // Username (used by super_admin & hrms_handler)
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows null for phone-based users
    },

    // Phone number (used by employee, hod, director)
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows null for admin users
      match: [/^\d{10}$/, 'Phone number must be 10 digits'],
    },

    password: {
      type: String,
      required: true,
      select: false, // never expose password by default
    },

    /* =========================
       ROLE MANAGEMENT
    ========================= */

    role: {
      type: String,
      enum: ['super_admin', 'hrms_handler', 'director', 'hod', 'employee'],
      required: true,
      index: true,
    },

    /* =========================
   DEPARTMENT (HOD / DIRECTOR)
========================= */

department: {
  type: String,
  required: function () {
    return this.role === 'hod';
  },
  index: true,
},

    /* =========================
       EMPLOYEE LINKING
    ========================= */

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    // HOD → employees
    assignedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],

    // Director → HODs
    assignedHODs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Director → employees directly
    assignedDirectEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],

    // Reporting hierarchy
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /* =========================
       SECURITY & STATUS
    ========================= */

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    // 🔐 FORCE CHANGE FOR DEFAULT PASSWORD USERS
    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    /* =========================
       PASSWORD RESET
    ========================= */

    resetToken: {
      type: String,
      select: false,
    },

    resetTokenExpiry: {
      type: Date,
      select: false,
    },

    /* =========================
       AUDIT
    ========================= */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /* =========================
       LEGACY SUPPORT (OPTIONAL)
    ========================= */

    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   PASSWORD HASHING
========================= */

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    if (!this.passwordChangedAt) {
      this.passwordChangedAt = new Date();
    }

    next();
  } catch (err) {
    next(err);
  }
});

/* =========================
   METHODS
========================= */

userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
