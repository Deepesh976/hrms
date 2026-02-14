const mongoose = require('mongoose');

/**
 * Default Leave Allocation Sub-Schema
 */
const defaultLeaveAllocationSchema = new mongoose.Schema({
  leaveType: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  annualAllocation: {
    type: Number,
    required: true,
    min: 0
  },
  accrualType: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual', 'none'],
    default: 'monthly'
  },
  accrualRate: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

/**
 * Leave Policy Schema
 * Company-wide leave policy configuration
 */
const leavePolicySchema = new mongoose.Schema({
  policyName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Leave Year Configuration
  leaveYearStartMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    default: 1 // January
  },
  leaveYearStartDay: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
    default: 1
  },
  
  // Default Allocations
  defaultLeaveAllocations: [defaultLeaveAllocationSchema],
  
  // Working Days Configuration
  workingDaysPerWeek: {
    type: Number,
    required: true,
    min: 5,
    max: 6,
    default: 6
  },
  weekends: {
    type: [String],
    default: ['Sunday']
  },
  
  // Leave Calculation Rules
  includeWeekendsInLeave: {
    type: Boolean,
    default: false
  },
  includeHolidaysInLeave: {
    type: Boolean,
    default: false
  },
  
  // Carry Forward Rules
  maxCarryForwardDays: {
    type: Number,
    default: 0,
    min: 0
  },
  carryForwardExpiryMonths: {
    type: Number,
    default: 0,
    min: 0
  },
  resetCarryForwardOnNewYear: {
    type: Boolean,
    default: true
  },
  
  // Encashment Rules
  allowLeaveEncashment: {
    type: Boolean,
    default: false
  },
  minServiceYearsForEncashment: {
    type: Number,
    default: 1,
    min: 0
  },
  maxEncashmentDaysPerYear: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Negative Balance
  allowNegativeBalance: {
    type: Boolean,
    default: false
  },
  maxNegativeBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Applicability
  applicableTo: {
    type: String,
    default: 'All',
    enum: ['All', 'Department', 'Designation']
  },
  departments: {
    type: [String],
    default: []
  },
  designations: {
    type: [String],
    default: []
  },
  
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
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
leavePolicySchema.index({ isDefault: 1, isActive: 1 });
leavePolicySchema.index({ isActive: 1 });

// Update timestamp before saving
leavePolicySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Get leave allocation for a specific type
 */
leavePolicySchema.methods.getLeaveAllocation = function(leaveType) {
  return this.defaultLeaveAllocations.find(a => a.leaveType === leaveType);
};

/**
 * Check if carry forward is allowed
 */
leavePolicySchema.methods.isCarryForwardAllowed = function() {
  return this.maxCarryForwardDays > 0;
};

/**
 * Check if a department/designation is covered by this policy
 */
leavePolicySchema.methods.isApplicable = function(department = null, designation = null) {
  if (this.applicableTo === 'All') return true;
  
  if (this.applicableTo === 'Department' && department) {
    return this.departments.includes(department);
  }
  
  if (this.applicableTo === 'Designation' && designation) {
    return this.designations.includes(designation);
  }
  
  return false;
};

/**
 * Static method to get default policy
 */
leavePolicySchema.statics.getDefaultPolicy = async function() {
  return await this.findOne({ isDefault: true, isActive: true });
};

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);

