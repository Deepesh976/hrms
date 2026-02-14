const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  listForRole,
  create,
  getUnreadCount,
  remove
} = require('../controllers/notificationController');

/* =========================
   GET NOTIFICATIONS
========================= */
// Get notifications for logged-in user (role-based filtering handled in controller)
router.get('/', protect, listForRole);

// Get unread notifications count (employees only)
router.get('/unread-count', protect, getUnreadCount);

/* =========================
   CREATE NOTIFICATION
========================= */
// Allowed: HRMS Handler, Admin, Super Admin, HOD, Director
router.post(
  '/',
  protect,
  authorizeRoles(
    'admin',
    'superadmin',
    'super_admin',
    'hrms_handler',
    'hod',
    'director'
  ),
  create
);

/* =========================
   DELETE NOTIFICATION 🔐
========================= */
// Delete permissions are STRICTLY handled inside controller:
// hrms_handler post → hrms_handler, super_admin
// director post     → director, hrms_handler, super_admin
// hod post          → hod, director, hrms_handler, super_admin
// super_admin post  → super_admin only
// employee post     → nobody
router.delete('/:id', protect, remove);

module.exports = router;
