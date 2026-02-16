const mongoose = require('mongoose');

const salaryHistorySchema = new mongoose.Schema({
  empId: { type: String, required: true },
  empName: String,

  // 🔥 Salary snapshot
  actualCTC: { type: Number, required: true },
  consileSalary: Number,
  basic: Number,
  hra: Number,
  cca: Number,
  trpAlw: Number,
  oAlw1: Number,

  // 🔥 Versioning
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date, default: null },

  // 🔥 Audit
  updatedBy: { type: String, required: true },
  reason: { type: String, required: true },

  createdAt: { type: Date, default: Date.now }
});

/* ======================================================
   🔥 PRODUCTION AUTO-BREAKDOWN (SELF HEALING)
   This runs EVERY time document is saved.
====================================================== */
salaryHistorySchema.pre('save', function (next) {

  if (!this.actualCTC) return next();

  const ctc = Math.round(Number(this.actualCTC || 0));

  let consileSalary = 0;

  if (ctc < 15285) {
    consileSalary = ctc / 1.1758;
  } else if (ctc <= 23757) {
    consileSalary = ctc / 1.1638;
  } else if (ctc <= 34298) {
    consileSalary = ctc / 1.1313;
  } else {
    consileSalary = (ctc - 1800) / 1.0833;
  }

  consileSalary = Math.round(consileSalary);

  let basic =
    consileSalary >= 30000
      ? 15000
      : consileSalary > 13000
        ? consileSalary * 0.4
        : consileSalary * 0.5;

  basic = Math.round(basic);

  const hra = Math.round(basic * 0.4);
  const cca = 1000;
  const trpAlw = 1600;

  const oAlw1 = Math.round(
    consileSalary - (basic + hra + cca + trpAlw)
  );

  // 🔥 Always overwrite breakdown (source of truth = actualCTC)
  this.consileSalary = consileSalary;
  this.basic = basic;
  this.hra = hra;
  this.cca = cca;
  this.trpAlw = trpAlw;
  this.oAlw1 = oAlw1;

  next();
});

module.exports = mongoose.model('SalaryHistory', salaryHistorySchema);
