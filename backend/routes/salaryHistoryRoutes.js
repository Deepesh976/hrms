const express = require('express');
const router = express.Router();

const {
  getSalaryHistoryByEmpId,
  addSalaryRevision,
  updateSalaryHistory,
  deleteSalaryHistory,
  repairAllSalaryHistory
} = require('../controllers/salaryHistoryController');

const { protect, requireAdmin } = require('../middleware/authMiddleware');

/* =====================================================
   🔥 REPAIR ALL (PUT THIS FIRST!)
===================================================== */
router.post('/repair-all', protect, requireAdmin, repairAllSalaryHistory);

/* =====================================================
   GET salary history by employee ID
===================================================== */
router.get('/:empId', protect, requireAdmin, getSalaryHistoryByEmpId);

/* =====================================================
   ADD salary revision
===================================================== */
router.post('/:empId/add', protect, requireAdmin, addSalaryRevision);

/* =====================================================
   UPDATE salary history entry
===================================================== */
router.put('/:historyId', protect, requireAdmin, updateSalaryHistory);

/* =====================================================
   DELETE salary history entry
===================================================== */
router.delete('/:historyId', protect, requireAdmin, deleteSalaryHistory);

module.exports = router;
