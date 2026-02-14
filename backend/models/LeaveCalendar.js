const mongoose = require('mongoose');

/**
 * Leave Calendar Schema
 * ✅ Single source of truth for GLOBAL holidays
 * ❌ No department / unit specific logic
 */
const LeaveCalendarSchema = new mongoose.Schema(
  {
    /* =====================
       DATE INFORMATION
    ===================== */
    date: {
      type: Date,
      required: true,
      index: true
    },

    year: {
      type: Number,
      index: true
    },

    month: {
      type: Number,
      min: 1,
      max: 12,
      index: true
    },

    dayOfWeek: {
      type: String,
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      index: true
    },

    /* =====================
       HOLIDAY INFORMATION
    ===================== */
    type: {
      type: String,
      enum: [
        'public_holiday',
        'restricted_holiday',
        'weekend',
        'company_event'
      ],
      default: 'public_holiday',
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    /* =====================
       DAY BEHAVIOR
    ===================== */
    isWorkingDay: {
      type: Boolean,
      default: false,
      index: true
    },

    isOptional: {
      type: Boolean,
      default: false
    },

    /* =====================
       WEEKEND CONFIG
    ===================== */
    isWeekend: {
      type: Boolean,
      default: false,
      index: true
    },

    weekendType: {
      type: String,
      enum: ['full', 'half', null],
      default: null
    },

    /* =====================
       METADATA
    ===================== */
    createdBy: {
      type: String,
      trim: true,
      default: 'system'
    }
  },
  {
    timestamps: true
  }
);

/* =====================
   INDEXES
===================== */

// ✅ One holiday per date (GLOBAL)
LeaveCalendarSchema.index({ date: 1 }, { unique: true });

// Fast month-wise queries
LeaveCalendarSchema.index({ year: 1, month: 1 });

// Attendance / activity filters
LeaveCalendarSchema.index({ type: 1, isWorkingDay: 1 });

/* =====================
   PRE-SAVE HOOK
===================== */
LeaveCalendarSchema.pre('save', function (next) {
  if (!this.date) {
    return next(new Error('Date is required'));
  }

  const d = new Date(this.date);

  if (isNaN(d.getTime())) {
    return next(new Error('Invalid date provided'));
  }

  // 🔒 Normalize date to start of day
  d.setHours(0, 0, 0, 0);
  this.date = d;

  // Auto-populate year & month
  this.year = d.getFullYear();
  this.month = d.getMonth() + 1;

  // Auto-populate day of week
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  this.dayOfWeek = days[d.getDay()];

  next();
});

/* =====================
   METHODS
===================== */

/**
 * Check if this calendar entry represents a weekend
 */
LeaveCalendarSchema.methods.isWeekendDay = function () {
  return this.isWeekend || ['Saturday', 'Sunday'].includes(this.dayOfWeek);
};

module.exports =
  mongoose.models.LeaveCalendar ||
  mongoose.model('LeaveCalendar', LeaveCalendarSchema);
