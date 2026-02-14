const express = require('express');
const router = express.Router();

const {
  createAdmin,
  getAllAdmins,
  deleteAdmin
} = require('../controllers/adminController'); 
// ⬆️ make sure this points to the UPDATED controller we fixed

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

/* =========================================================
   HRMS HANDLER MANAGEMENT (SUPER ADMIN ONLY)
========================================================= */

// 🔐 Create HRMS Handler
// POST /api/admin/create
router.post(
  '/create',
  protect,
  authorizeRoles('super_admin'),
  createAdmin
);

// 🔐 Get All HRMS Handlers
// GET /api/admin/all
router.get(
  '/all',
  protect,
  authorizeRoles('super_admin'),
  getAllAdmins
);

// 🔐 Delete HRMS Handler by ID
// DELETE /api/admin/:id
router.delete(
  '/:id',
  protect,
  authorizeRoles('super_admin'),
  deleteAdmin
);

module.exports = router;
