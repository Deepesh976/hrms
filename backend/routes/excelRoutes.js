const express = require('express');
const router = express.Router();

const {
  uploadInputData,
  getAllInputData,
  deleteAllInputData,
  updateInputDataById,
  deleteInputDataById,
  deleteManyInputData
} = require('../controllers/inputDataController');

// Upload
router.post('/upload', uploadInputData);

// Get all
router.get('/', getAllInputData);

// Update
router.put('/:id', updateInputDataById);

// Delete one
router.delete('/:id', deleteInputDataById);

// Clear all (using existing function)
router.delete('/clear', deleteAllInputData);

// Bulk delete
router.post('/delete-many', deleteManyInputData);

module.exports = router;
