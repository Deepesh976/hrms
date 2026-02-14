const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    // audience indicates broad visibility or type of targeting
    audience: { 
      type: String, 
      enum: ['all', 'employee', 'admin', 'superadmin', 'department', 'individual', 'team'], 
      default: 'all' 
    },
    // Optional precise targeting
    targetDepartment: { type: String, trim: true, default: '' },
    // Support multiple target employees (for HOD/Director to their team)
    targetEmployeeIds: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Employee' 
    }],
    // Legacy support
    targetEmployeeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Employee', 
      default: null 
    },
    // Who created the notification
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByRole: { 
      type: String, 
      enum: ['hr', 'admin', 'superadmin', 'hrms_handler', 'super_admin', 'hod', 'director'], 
      required: true 
    },
  },
  { timestamps: true }
);

// Index for faster queries
NotificationSchema.index({ targetEmployeeIds: 1, createdAt: -1 });
NotificationSchema.index({ audience: 1, createdAt: -1 });
NotificationSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
