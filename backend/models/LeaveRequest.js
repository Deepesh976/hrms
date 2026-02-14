const mongoose = require('mongoose');

/**
 * Attachment Sub-Schema
 */
const attachmentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    required: true,
    trim: true
  },
  fileType: {
    type: String,
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

/**
 * Leave Request Schema
 * Enhanced with employee linkage and complete workflow tracking
 */
const LeaveRequestSchema = new mongoose.Schema(
  {
    // Auto-generated Leave Request ID
    leaveRequestId: {
      type: String,
      unique: true,
      trim: true
    },

    // Employee Details (CHANGED from User to Employee)
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
    department: {
      type: String,
      trim: true,
      default: ''
    },

    // Leave Details
    leaveType: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      enum: ['AL', 'CL', 'BTL']
    },
    leaveTypeName: {
      type: String,
      trim: true
    },

    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },

    // Half Day Support
    isHalfDay: {
      type: Boolean,
      default: false
    },
    halfDaySession: {
      type: String,
      enum: ['first_half', 'second_half', null],
      default: null
    },

    totalDays: {
      type: Number,
      required: true,
      min: 0
    },

    // Request Information
    reason: {
      type: String,
      trim: true,
      required: true
    },

    attachments: [attachmentSchema],

    // Contact During Leave
    contactDuringLeave: {
      type: String,
      trim: true,
      default: ''
    },

    // Workflow & Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'withdrawn'],
      default: 'pending',
      index: true
    },

    // Current Approver (for hierarchical approval)
    currentApprover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    currentApproverRole: {
      type: String,
      enum: ['hod', 'director', 'hrms_handler', 'super_admin'],
      trim: true
    },

    // Approval Chain History
    approvalChain: [{
      approverRole: {
        type: String,
        enum: ['hod', 'director', 'hrms_handler', 'super_admin']
      },
      approverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approverName: String,
      action: {
        type: String,
        enum: ['pending', 'approved', 'rejected']
      },
      reviewedAt: Date,
      comment: String
    }],

    // Legacy Approver Information (keep for backward compatibility)
    approverRole: {
      type: String,
      enum: ['hod', 'director', 'hrms_handler', 'super_admin'],
      trim: true
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    appliedAt: {
      type: Date,
      default: Date.now
    },
    appliedBy: {
      type: String,
      trim: true
    },

    reviewedBy: {
      type: String,
      trim: true
    },
    reviewedAt: {
      type: Date
    },

    decisionComment: {
      type: String,
      trim: true
    },

    // Cancel/Withdraw
    cancelledBy: {
      type: String,
      trim: true
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true
    },

    // Integration with Balance
    balanceBeforeRequest: {
      type: Number,
      default: 0
    },
    balanceAfterRequest: {
      type: Number,
      default: 0
    },

    // Salary Integration Flag
    isAppliedToSalary: {
      type: Boolean,
      default: false
    },
    salaryMonth: {
      type: Number,
      min: 1,
      max: 12
    },
    salaryYear: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

// Indexes
LeaveRequestSchema.index({ empId: 1, status: 1 });
LeaveRequestSchema.index({ empId: 1, startDate: 1, endDate: 1 });
LeaveRequestSchema.index({ status: 1, startDate: 1 });
LeaveRequestSchema.index({ leaveType: 1 });
LeaveRequestSchema.index({ leaveRequestId: 1 }, { unique: true, sparse: true });

// Pre-save hook to generate Leave Request ID
LeaveRequestSchema.pre('save', function (next) {
  if (!this.leaveRequestId) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.leaveRequestId = `LR-${year}-${randomNum}`;
  }
  next();
});

/**
 * Check if leave request can be cancelled
 */
LeaveRequestSchema.methods.canBeCancelled = function () {
  return ['pending', 'approved'].includes(this.status) && !this.isAppliedToSalary;
};

/**
 * Check if leave request is in past
 */
LeaveRequestSchema.methods.isInPast = function () {
  return new Date(this.startDate) < new Date();
};

module.exports = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', LeaveRequestSchema);
