const express = require('express');
const router = express.Router();
const {
  getHODs,
  getHOD,
  createNewHOD,
  updateHODById,
  deleteHODById,
  assignEmployees,
  unassignEmployee,
  getAssignedEmployees,
  getUnassigned
} = require('../controllers/hodController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise '/unassigned-employees' will match '/:id'

// Employee assignment routes (specific routes first)
router.get('/unassigned-employees', getUnassigned);
router.get('/:hodId/employees', getAssignedEmployees);
router.post('/:hodId/assign-employees', assignEmployees);
router.post('/:hodId/unassign-employee/:employeeId', unassignEmployee);

// HOD CRUD routes (parameterized routes after specific routes)
router.route('/')
  .get(getHODs)
  .post(createNewHOD);

router.route('/:id')
  .get(getHOD)
  .put(updateHODById)
  .delete(deleteHODById);

module.exports = router;
