const mongoose = require('mongoose');

/**
 * Schema for individual leave type balance
 */
const leaveBalanceSchema = new mongoose.Schema({
  leaveType: {
    type: String,
    required: true,
    trim: true,
    enum: ['AL', 'PL', 'CL', 'SL', 'ML', 'PL_PATERNITY', 'BL', 'CO', 'LWP']
  },
  leaveTypeName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Balance Tracking
  opening: {
    type: Number,
    default: 0,
    min: 0
  },
  allocated: {
    type: Number,
    default: 0,
    min: 0
  },
  accrued: {
    type: Number,
    default: 0,
    min: 0
  },
  
  consumed: {
    type: Number,
    default: 0,
    min: 0
  },
  pending: {
    type: Number,
    default: 0,
    min: 0
  },
  approved: {
    type: Number,
    default: 0,
    min: 0
  },
  
  balance: {
    type: Number,
    default: 0
    // No min constraint - balance can be negative (over-consumption)
  },
  lapsed: {
    type: Number,
    default: 0,
    min: 0
  },
  carriedForward: {
    type: Number,
    default: 0,
    min: 0
  },
  encashed: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Configuration
  maxCarryForward: {
    type: Number,
    default: 0
  },
  maxAccumulation: {
    type: Number,
    default: 0
  },
  
  // Accrual Tracking
  lastAccrualDate: {
    type: Date,
    default: null
  },
  nextAccrualDate: {
    type: Date,
    default: null
  }
}, { _id: false });

/**
 * Main Employee Leave Balance Schema
 */
const employeeLeaveBalanceSchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  empName: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  
  leaveBalances: [leaveBalanceSchema],
  
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

// Compound unique index
employeeLeaveBalanceSchema.index({ empId: 1, year: 1 }, { unique: true });

// Update timestamp before saving
employeeLeaveBalanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Get balance for a specific leave type
 */
employeeLeaveBalanceSchema.methods.getLeaveBalance = function(leaveType) {
  const balance = this.leaveBalances.find(lb => lb.leaveType === leaveType);
  return balance || null;
};

/**
 * Update balance for a specific leave type
 */
employeeLeaveBalanceSchema.methods.updateLeaveBalance = function(leaveType, updates) {
  const balanceIndex = this.leaveBalances.findIndex(lb => lb.leaveType === leaveType);
  
  if (balanceIndex !== -1) {
    Object.assign(this.leaveBalances[balanceIndex], updates);
  } else {
    this.leaveBalances.push({
      leaveType,
      ...updates
    });
  }
  
  return this;
};

/**
 * Calculate total available balance
 */
employeeLeaveBalanceSchema.methods.getTotalAvailableBalance = function(leaveType) {
  const balance = this.getLeaveBalance(leaveType);
  if (!balance) return 0;
  
  return balance.accrued - balance.consumed - balance.pending;
};

module.exports = mongoose.model('EmployeeLeaveBalance', employeeLeaveBalanceSchema);

