const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  uploadActivityData,
  getAllActivities,
  deleteAllActivities,
  deleteActivitiesByDateRange, // ✅ FIX: IMPORT ADDED
  uploadActivityExcel,
  updateActivityStatus,
} = require('../controllers/activityController');

const {
  protect,
  requireAdmin,
  authorizeRoles,
  authorizeDepartment,
} = require('../middleware/authMiddleware');

/* =========================================================
   MULTER CONFIG
========================================================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname,
    });

    const allowedExtensions = /\.(xlsx|xls)$/i;
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ];

    if (
      allowedExtensions.test(file.originalname) ||
      allowedMimeTypes.includes(file.mimetype)
    ) {
      console.log('✅ File accepted:', file.originalname);
      return cb(null, true);
    }

    console.error('❌ File rejected:', file.originalname);
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
  },
});

/* =========================================================
   🔥 MIDDLEWARE: Validate FROM / TO Date (NO UTC / NO SHIFT)
========================================================= */
const validateUploadDateRange = (req, res, next) => {
  const { fromDate, toDate } = req.body;

  console.log('📅 Upload date range received:', { fromDate, toDate });

  if (!fromDate || !toDate) {
    return res.status(400).json({
      success: false,
      message: 'fromDate and toDate are required',
    });
  }

  const [fy, fm, fd] = fromDate.split('-').map(Number);
  const [ty, tm, td] = toDate.split('-').map(Number);

  if (!fy || !fm || !fd || !ty || !tm || !td) {
    return res.status(400).json({
      success: false,
      message: 'Invalid fromDate or toDate format',
    });
  }

  const from = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
  const to = new Date(ty, tm - 1, td, 0, 0, 0, 0);

  if (from > to) {
    return res.status(400).json({
      success: false,
      message: 'fromDate cannot be after toDate',
    });
  }

  console.log('✅ Validated upload range:', {
    from: from.toDateString(),
    to: to.toDateString(),
  });

  req.uploadRange = { fromDate: from, toDate: to };
  next();
};

/* =========================================================
   ACTIVITY (ATTENDANCE) ROUTES
========================================================= */

/**
 * 🔥 UPDATE ACTIVITY STATUS
 * PATCH /api/activities/:id/status
 */
router.patch(
  '/:id/status',
  protect,
  authorizeRoles('super_admin', 'superadmin', 'admin', 'hrms_handler'),
  updateActivityStatus
);

/**
 * Upload activity data (JSON)
 */
router.post(
  '/upload',
  protect,
  requireAdmin,
  uploadActivityData
);

/**
 * Upload activity data (Excel)
 */
router.post(
  '/upload-excel',
  protect,
  authorizeRoles('super_admin', 'superadmin', 'admin', 'hrms_handler'),
  upload.single('file'),
  validateUploadDateRange,
  uploadActivityExcel
);

/**
 * Get all activities
 * 🔥 Employee / HOD / Director filtering handled by authorizeDepartment
 */
router.get(
  '/',
  protect,
  authorizeRoles(
    'super_admin',
    'superadmin',
    'admin',
    'hrms_handler',
    'director',
    'hod',
    'employee'
  ),
  authorizeDepartment,
  getAllActivities
);

/**
 * Delete ALL activities (ADMIN ONLY)
 */
router.delete(
  '/',
  protect,
  requireAdmin,
  deleteAllActivities
);

/**
 * 🔥 Delete activities by DATE RANGE (SAFE DELETE)
 * DELETE /api/activities/date-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&empId=optional
 */
router.delete(
  '/date-range',
  protect,
  authorizeRoles('admin', 'hrms_handler', 'super_admin', 'superadmin'),
  deleteActivitiesByDateRange
);

module.exports = router;
