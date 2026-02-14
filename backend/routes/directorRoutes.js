const express = require('express');
const router = express.Router();
const {
  getDirectors,
  getDirector,
  getHierarchy,
  createNewDirector,
  updateDirectorById,
  deleteDirectorById,
  assignHODs,
  unassignHOD,
  assignEmployees,
  unassignEmployee,
  getUnassignedHODsList,
  getCompletelyUnassigned
} = require('../controllers/directorController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise '/unassigned-hods' will match '/:id'

// Specific routes first
router.get('/unassigned-hods', getUnassignedHODsList);
router.get('/unassigned-employees', getCompletelyUnassigned);

// Director CRUD routes (parameterized routes after specific routes)
router.route('/')
  .get(getDirectors)
  .post(createNewDirector);

router.route('/:id')
  .get(getDirector)
  .put(updateDirectorById)
  .delete(deleteDirectorById);

// Hierarchy route
router.get('/:id/hierarchy', getHierarchy);

// HOD assignment routes
router.post('/:directorId/assign-hods', assignHODs);
router.post('/:directorId/unassign-hod/:hodId', unassignHOD);

// Employee assignment routes (for unassigned employees)
router.post('/:directorId/assign-employees', assignEmployees);
router.post('/:directorId/unassign-employee/:employeeId', unassignEmployee);

module.exports = router;
