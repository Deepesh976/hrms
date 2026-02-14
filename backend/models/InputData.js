const mongoose = require('mongoose');

const inputDataSchema = new mongoose.Schema(
  {
    EmpID: {
      type: String,
      required: true,
      trim: true,
      index: true
      // ❌ REMOVED `unique: true`
      // Reason: One employee can have multiple future updates / revisions
    },

    EmpName: {
      type: String,
      required: true,
      trim: true
    },

    // =========================
    // 🔥 CORE SALARY INPUT
    // =========================
    ActualCTCWithoutLossOfPay: {
      type: Number,
      default: 0
    },

    CONSILESALARY: {
      type: Number,
      default: 0
    },

    Basic: {
      type: Number,
      default: 0
    },

    HRA: {
      type: Number,
      default: 0
    },

    CCA: {
      type: Number,
      default: 0
    },

    TRP_ALW: {
      type: Number,
      default: 0
    },

    O_ALW1: {
      type: Number,
      default: 0
    },

    PLB: {
      type: Number,
      default: 0
    },

    TDS: {
      type: Number,
      default: 0
    },

    // =========================
    // 🔥 EFFECTIVE DATE CONTROLS
    // =========================
    effectiveFromYear: {
      type: Number,
      required: true,
      default: new Date().getFullYear()
    },

    effectiveFromMonth: {
      type: String,
      required: true,
      enum: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ],
      default: 'Jan'
    }
  },
  {
    timestamps: true
  }
);

// =========================
// 🔥 INDEXES (SAFE & USEFUL)
// =========================

// Fast lookup per employee
inputDataSchema.index({ EmpID: 1 });

// Prevent exact duplicate effective rows (optional safety)
inputDataSchema.index(
  { EmpID: 1, effectiveFromYear: 1, effectiveFromMonth: 1 },
  { unique: false }
);

module.exports = mongoose.model('InputData', inputDataSchema);
