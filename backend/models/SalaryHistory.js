const mongoose = require('mongoose');

const salaryHistorySchema = new mongoose.Schema({
  empId: { type: String, required: true },
  empName: String,

  // 🔥 Current salary snapshot
  actualCTC: { type: Number, required: true },
  consileSalary: Number,
  basic: Number,
  hra: Number,
  cca: Number,
  trpAlw: Number,
  oAlw1: Number,

  // 🔥 Versioning
  effectiveFrom: { type: Date, required: true },  // REAL DATE (e.g. 2025-10-01)
  effectiveTo: { type: Date, default: null },     // Closed automatically

  // 🔥 Audit trail
  updatedBy: { type: String, required: true },
  reason: { type: String, required: true },

  // 🔥 Metadata
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SalaryHistory', salaryHistorySchema);
