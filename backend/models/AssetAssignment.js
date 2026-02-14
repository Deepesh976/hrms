const mongoose = require('mongoose');

const AssetAssignmentSchema = new mongoose.Schema(
  {
    /* ======================================================
       🔑 LINK TO EMPLOYEE (ONLY FOR EMPLOYEES)
       ⚠️ EDGE CASE: HOD & DIRECTOR → employee = null
    ====================================================== */
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,           // ✅ null for HOD / Director
      index: true,
    },

    /* ======================================================
       👤 EMPLOYEE ID (ONLY FOR EMPLOYEES)
       ⚠️ EDGE CASE: HOD & DIRECTOR → empId = null
    ====================================================== */
    empId: {
      type: String,
      default: null,           // ✅ null for HOD / Director
      trim: true,
      index: true,
    },

    /* ======================================================
       👤 ASSIGNEE DISPLAY (EVERYONE)
    ====================================================== */
    assigneeName: {
      type: String,
      required: true,          // ✅ employee / hod / director
      trim: true,
      index: true,
    },

    assigneeRole: {
      type: String,
      enum: ['employee', 'hod', 'director'],
      required: true,
      index: true,
    },

    /* ======================================================
       🏢 DEPARTMENT / DESIGNATION
       - Employee → department
       - HOD → "HOD - IT"
       - Director → "Director"
    ====================================================== */
    department: {
      type: String,
      trim: true,
      index: true,
    },

    /* ======================================================
       📦 ASSET DETAILS
    ====================================================== */
    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    serialNumber: {
      type: String,
      trim: true,
    },

    issuedDate: {
      type: Date,
      required: true,
    },

    condition: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ['issued', 'returned'],
      default: 'issued',
      index: true,
    },
  },
  { timestamps: true }
);

/* ======================================================
   🔥 PERFORMANCE INDEXES
====================================================== */
AssetAssignmentSchema.index({ assigneeRole: 1 });
AssetAssignmentSchema.index({ assigneeName: 1 });
AssetAssignmentSchema.index({ empId: 1 });
AssetAssignmentSchema.index({ department: 1 });
AssetAssignmentSchema.index({ status: 1 });

module.exports =
  mongoose.models.AssetAssignment ||
  mongoose.model('AssetAssignment', AssetAssignmentSchema);
