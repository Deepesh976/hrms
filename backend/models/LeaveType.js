const mongoose = require('mongoose');

/**
 * Leave Type Schema
 * Master configuration for different types of leaves
 */
const leaveTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    enum: ['AL', 'CL', 'BTL']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },

  // Leave Payment Rules
  isPaid: {
    type: Boolean,
    default: true,
    required: true
  },

  // Carry Forward Rules
  isCarryForwardAllowed: {
    type: Boolean,
    default: false
  },
  maxCarryForward: {
    type: Number,
    default: 0,
    min: 0
  },

  // Accrual Rules
  accrualType: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual', 'none'],
    default: 'none'
  },
  accrualRate: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAccumulation: {
    type: Number,
    default: 0,
    min: 0
  },

  // Application Rules
  minDaysAdvance: {
    type: Number,
    default: 0,
    min: 0
  },
  maxConsecutiveDays: {
    type: Number,
    default: 0,
    min: 0
  },
  allowsHalfDay: {
    type: Boolean,
    default: true
  },

  // Eligibility Rules
  minServiceMonths: {
    type: Number,
    default: 0,
    min: 0
  },
  applicableGender: {
    type: String,
    enum: ['All', 'Male', 'Female'],
    default: 'All'
  },

  // Prorating Rules
  isProratedForNewJoiners: {
    type: Boolean,
    default: true
  },
  isProratedForExitEmployees: {
    type: Boolean,
    default: true
  },

  // Documentation Requirements
  requiresDocumentation: {
    type: Boolean,
    default: false
  },
  documentationDaysThreshold: {
    type: Number,
    default: 0,
    min: 0
  },

  // Priority & Status
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
leaveTypeSchema.index({ code: 1 }, { unique: true });
leaveTypeSchema.index({ isActive: 1 });
leaveTypeSchema.index({ displayOrder: 1 });

// Update timestamp before saving
leaveTypeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Check if documentation is required for given days
 */
leaveTypeSchema.methods.isDocumentationRequired = function (days) {
  if (!this.requiresDocumentation) return false;
  return days >= this.documentationDaysThreshold;
};

/**
 * Check if advance notice requirement is met
 */
leaveTypeSchema.methods.isAdvanceNoticeValid = function (startDate) {
  if (this.minDaysAdvance === 0) return true;

  const today = new Date();
  const start = new Date(startDate);
  const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

  return diffDays >= this.minDaysAdvance;
};

/**
 * Check if employee is eligible based on gender
 */
leaveTypeSchema.methods.isGenderEligible = function (gender) {
  if (this.applicableGender === 'All') return true;
  return this.applicableGender === gender;
};

module.exports = mongoose.model('LeaveType', leaveTypeSchema);

