// models/Activity.js

const mongoose = require('mongoose');

/* =================================================
   🔥 CENTRAL STATUS LIST (SINGLE SOURCE OF TRUTH)
================================================= */
const STATUS_ENUM = ['P', 'A', '½P', 'WO', 'HO', 'ALF', 'ALH'];

const activitySchema = new mongoose.Schema(
  {
    /* =========================
       BASIC IDENTITY
    ========================= */
    empId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    empName: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    shift: {
      type: String,
      default: 'GS',
      trim: true,
    },

    /* =========================
       TIME FIELDS (RAW)
    ========================= */
    timeInActual: {
      type: String,
      default: '00:00:00',
    },

    timeOutActual: {
      type: String,
      default: '00:00:00',
    },

    lateBy: {
      type: String,
      default: '00:00:00',
    },

    earlyBy: {
      type: String,
      default: '00:00:00',
    },

    ot: {
      type: String,
      default: '00:00:00',
    },

    duration: {
      type: String,
      default: '00:00:00',
    },

    /* =========================
       ATTENDANCE STATUS
    ========================= */
    status: {
      type: String,
      enum: STATUS_ENUM,
      default: 'A',
      index: true,
    },

    /* =================================================
       🔥 STATUS CHANGE FLAGS (USED BY UI)
    ================================================= */
    isStatusModified: {
      type: Boolean,
      default: false,
      index: true,
    },

    originalStatus: {
      type: String,
      enum: STATUS_ENUM,
      default: null,
    },

    statusChangeReason: {
      type: String,
      default: null,
      trim: true,
    },

    statusChangedBy: {
      type: String, // admin userId / empId
      default: null,
    },

    statusChangeDate: {
      type: Date,
      default: null,
    },

    /* =================================================
       🔥 AUDIT HISTORY (KEEP – DO NOT REMOVE)
    ================================================= */
    isManuallyEdited: {
      type: Boolean,
      default: false,
      index: true,
    },

    statusHistory: [
      {
        oldStatus: {
          type: String,
          enum: STATUS_ENUM,
          required: true,
        },

        newStatus: {
          type: String,
          enum: STATUS_ENUM,
          required: true,
        },

        reason: {
          type: String,
          required: true,
          trim: true,
        },

        changedBy: {
          type: String,
          required: true,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

/* =========================
   INDEXES (IMPORTANT)
========================= */

// 🔒 One attendance record per employee per day
activitySchema.index({ empId: 1, date: 1 }, { unique: true });

// 🔍 Fast employee timeline queries
activitySchema.index({ empId: 1, date: -1 });

// 🔍 Status filtering
activitySchema.index({ status: 1, date: -1 });

// 🔍 Fast lookup of modified rows (UI highlight)
activitySchema.index({ isStatusModified: 1 });

module.exports = mongoose.model('Activity', activitySchema);
