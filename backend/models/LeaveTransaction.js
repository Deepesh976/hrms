const mongoose = require('mongoose');

/**
 * Leave Transaction Schema
 * Audit trail for all leave balance changes
 */
const leaveTransactionSchema = new mongoose.Schema({
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
  
  transactionType: {
    type: String,
    required: true,
    enum: ['accrual', 'consumption', 'cancellation', 'adjustment', 'carry_forward', 'encashment', 'lapse', 'reservation', 'release'],
    index: true
  },
  
  leaveType: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    enum: ['AL', 'PL', 'CL', 'SL', 'ML', 'PL_PATERNITY', 'BL', 'CO', 'LWP']
  },
  leaveTypeName: {
    type: String,
    trim: true
  },
  
  // Transaction Details
  previousBalance: {
    type: Number,
    required: true,
    default: 0
  },
  changeAmount: {
    type: Number,
    required: true,
    default: 0
  },
  newBalance: {
    type: Number,
    required: true,
    default: 0
  },
  
  // References
  leaveRequestId: {
    type: String,
    trim: true,
    default: null
  },
  
  // Details
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Performer
  performedBy: {
    type: String,
    required: true,
    trim: true,
    default: 'system'
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We'll manage our own timestamps
});

// Indexes
leaveTransactionSchema.index({ empId: 1, transactionDate: -1 });
leaveTransactionSchema.index({ leaveRequestId: 1 });
leaveTransactionSchema.index({ transactionType: 1 });
leaveTransactionSchema.index({ empId: 1, leaveType: 1, transactionDate: -1 });

/**
 * Static method to create a transaction
 */
leaveTransactionSchema.statics.createTransaction = async function(data) {
  const transaction = new this({
    empId: data.empId,
    empName: data.empName,
    transactionType: data.transactionType,
    leaveType: data.leaveType,
    leaveTypeName: data.leaveTypeName,
    previousBalance: data.previousBalance,
    changeAmount: data.changeAmount,
    newBalance: data.newBalance,
    leaveRequestId: data.leaveRequestId || null,
    transactionDate: data.transactionDate || new Date(),
    effectiveDate: data.effectiveDate || new Date(),
    remarks: data.remarks || '',
    performedBy: data.performedBy || 'system',
    performedAt: data.performedAt || new Date()
  });
  
  return await transaction.save();
};

/**
 * Get transaction history for an employee
 */
leaveTransactionSchema.statics.getEmployeeHistory = async function(empId, filters = {}) {
  const query = { empId, ...filters };
  return await this.find(query).sort({ transactionDate: -1 });
};

/**
 * Get transactions for a leave request
 */
leaveTransactionSchema.statics.getRequestTransactions = async function(leaveRequestId) {
  return await this.find({ leaveRequestId }).sort({ transactionDate: -1 });
};

module.exports = mongoose.model('LeaveTransaction', leaveTransactionSchema);

