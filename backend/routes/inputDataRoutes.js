const express = require('express');
const router = express.Router();

const {
  uploadInputData,
  getAllInputData,
  deleteAllInputData,
  updateInputDataById,
  deleteInputDataById,
  deleteManyInputData,
} = require('../controllers/inputDataController');

// =======================================
// INPUT DATA ROUTES (STAGING SALARY DATA)
// =======================================

// Upload Excel or frontend data
router.post('/upload', uploadInputData);

// Get all staged input data
router.get('/', getAllInputData);

// Delete all data (hard reset)
router.delete('/all', deleteAllInputData);

// Update one input row
router.put('/:id', updateInputDataById);

// Delete one input row
router.delete('/:id', deleteInputDataById);

// Bulk delete selected rows
router.post('/delete-many', deleteManyInputData);

module.exports = router;
