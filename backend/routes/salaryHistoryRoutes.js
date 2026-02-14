const express = require('express');
const router = express.Router();
const {
  getSalaryHistoryByEmpId,
  addSalaryRevision,
  updateSalaryHistory,
  deleteSalaryHistory
} = require('../controllers/salaryHistoryController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// ======================================
// GET salary history by employee ID
// ======================================
router.get('/:empId', protect, requireAdmin, (req, res, next) => {
  const { empId } = req.params;

  if (!empId || empId.trim() === '') {
    return res.status(400).json({ message: 'empId is required' });
  }

  next();
}, getSalaryHistoryByEmpId);

// ======================================
// POST add new salary revision
// ======================================
router.post('/:empId/add', protect, requireAdmin, addSalaryRevision);

// ======================================
// PUT update salary history entry
// ======================================
router.put('/:historyId', protect, requireAdmin, updateSalaryHistory);

// ======================================
// DELETE salary history entry
// ======================================
router.delete('/:historyId', protect, requireAdmin, deleteSalaryHistory);

module.exports = router;
