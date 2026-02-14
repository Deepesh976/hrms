const mongoose = require('mongoose');

/**
 * Monthly Summary Schema
 * 🔥 Payroll cycle: 21st → 20th
 * Example:
 * year=2025, month=10 → 21 Oct 2025 – 20 Nov 2025
 */
const monthlySummarySchema = new mongoose.Schema(
  {
    empId: {
      type: String,
      required: true,
      index: true,
    },

    empName: {
      type: String,
      required: true,
    },

    // Payroll cycle start year
    year: {
      type: Number,
      required: true,
      index: true,
    },

    // Payroll cycle start month (1–12)
    month: {
      type: Number,
      required: true,
      index: true,
      min: 1,
      max: 12,
    },

    /* =========================
       ATTENDANCE COUNTS
    ========================= */

    // P + 0.5 from ½P
    totalPresent: {
      type: Number,
      default: 0,
    },

    // A + missing days + 0.5 from ½P
    totalAbsent: {
      type: Number,
      default: 0,
    },

    totalLeaveTaken: {
      type: Number,
      default: 0,
    },

    // Count of WO days
    totalWOCount: {
      type: Number,
      default: 0,
    },

    // Count of HO days
    totalHOCount: {
      type: Number,
      default: 0,
    },

    // 🔥 28 / 29 / 30 / 31
    totalDays: {
      type: Number,
      required: true,
    },

    /* =========================
       AUDIT
    ========================= */

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

/* =========================
   INDEX
========================= */

monthlySummarySchema.index(
  { empId: 1, year: 1, month: 1 },
  { unique: true }
);

/* =========================
   HOOKS
========================= */

monthlySummarySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

monthlySummarySchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('MonthlySummary', monthlySummarySchema);
