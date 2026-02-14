const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const {
  getAssetsByRole,
  listAll,
  create,
  update,
  remove,
} = require('../controllers/assetController');

const Employee = require('../models/Employee');
const User = require('../models/User');

/* ======================================================
   🔍 SEARCH : EMPLOYEE / HOD / DIRECTOR
   👉 Used by HrAssets.jsx dropdown
====================================================== */
router.get(
  '/search',
  protect,
  authorizeRoles('super_admin', 'superadmin', 'admin', 'hrms_handler'),
  async (req, res) => {
    try {
      const q = (req.query.q || '').trim();

      // Empty search → empty dropdown
      if (!q) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      /* =========================
         1️⃣ EMPLOYEES (Employee collection)
      ========================= */
      const employees = await Employee.find({
        empStatus: 'W',
        $or: [
          { empId: { $regex: q, $options: 'i' } },
          { empName: { $regex: q, $options: 'i' } },
        ],
      })
        .limit(10)
        .select('empId empName department');

      const employeeResults = employees.map((e) => ({
        empId: e.empId,                  // ✅ REAL empId
        empName: e.empName,
        department: e.department,
        role: 'employee',
      }));

      /* =========================
         2️⃣ HOD / DIRECTOR (User collection)
         ❌ NO empId
         ✅ NAME + DESIGNATION ONLY
      ========================= */
      const users = await User.find({
        role: { $in: ['hod', 'director'] },
        isActive: true,  // ✅ Only active users
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      })
        .limit(10)
        .select('name role department');

      const userResults = users.map((u) => ({
        empId: null,                     // 🔥 intentionally NULL (HOD/Director don't have empId)
        empName: u.name,
        department:
          u.role === 'hod'
            ? `HOD - ${u.department || 'General'}`
            : 'Director',
        role: u.role,
      }));

      /* =========================
         FINAL MERGED RESPONSE
      ========================= */
      return res.status(200).json({
        success: true,
        data: [...employeeResults, ...userResults],
      });
    } catch (err) {
      console.error('❌ Asset search error:', err);
      return res.status(500).json({
        success: false,
        message: 'Search failed',
      });
    }
  }
);

/* ======================================================
   👤 / 👔 ROLE-BASED ASSET VIEW
   👉 Employee / HOD / Director dashboards
====================================================== */
/**
 * 👤 EMPLOYEE  → own assets
 * 👔 HOD       → own + employees under them
 * 🎯 DIRECTOR  → all assets
 */
router.get(
  '/my',
  protect,
  authorizeRoles('employee', 'hod', 'director'),
  getAssetsByRole
);

/* ======================================================
   👔 HR / ADMIN ROUTES
====================================================== */

/**
 * 👔 HR / Admin → View ALL assets
 */
router.get(
  '/',
  protect,
  authorizeRoles('super_admin', 'superadmin', 'admin', 'hrms_handler'),
  listAll
);

/**
 * 👔 HR / Admin → Assign asset
 */
router.post(
  '/',
  protect,
  authorizeRoles('super_admin', 'superadmin', 'admin', 'hrms_handler'),
  create
);

/**
 * 👔 HR / Admin → Update asset
 */
router.put(
  '/:id',
  protect,
  authorizeRoles('super_admin', 'superadmin', 'admin', 'hrms_handler'),
  update
);

/**
 * 👔 HR / Admin → Delete asset
 */
router.delete(
  '/:id',
  protect,
  authorizeRoles('super_admin', 'superadmin', 'admin', 'hrms_handler'),
  remove
);

module.exports = router;
