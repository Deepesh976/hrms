const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

// Import configurations
const { connectDB } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { APP_CONSTANTS } = require('./utils/constants');
const salaryHistoryRoutes = require('./routes/salaryHistoryRoutes');

// Initialize app
const app = express();

// ==============================
// DATABASE
// ==============================
connectDB();

// ==============================
// CORS CONFIG
// ==============================
const allowedOrigins = [process.env.CORS_ORIGIN].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server / mobile / Postman
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === 'development'
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ==============================
// BODY PARSERS
// ==============================
app.use(express.json({ limit: APP_CONSTANTS.MAX_JSON_SIZE }));
app.use(express.urlencoded({ extended: true }));

// ==============================
// STATIC FILES
// ==============================
app.use('/uploads', express.static('uploads'));

// ==============================
// MULTER CONFIG (Excel uploads)
// ==============================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: APP_CONSTANTS.MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const filetypes = APP_CONSTANTS.ALLOWED_FILE_TYPES.EXCEL;
    const extname = filetypes.test(
      file.originalname.toLowerCase().split('.').pop()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'));
  },
});

// ==============================
// API ROUTES (ORDER MATTERS)
// ==============================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/usersRoutes')); // ✅ FIXED (IMPORTANT)
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/salaries', require('./routes/salaryRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/slips', require('./routes/slipRoutes'));
app.use('/api/inputdata', require('./routes/inputDataRoutes'));
app.use('/api/excel', require('./routes/excelRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/monthly-summary', require('./routes/monthlySummaryRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/leave-types', require('./routes/leaveTypeRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/leave-calendar', require('./routes/leaveCalendarRoutes'));
app.use('/api/hods', require('./routes/hodRoutes'));
app.use('/api/directors', require('./routes/directorRoutes'));
app.use('/api/salary-history', salaryHistoryRoutes);

// ==============================
// ROOT ROUTE
// ==============================
app.get('/', (req, res) => {
  res.send('🚀 HRMS Backend API is running');
});

// ==============================
// HEALTH CHECK
// ==============================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});


// ==============================
// TEST ROUTE
// ==============================
app.post('/api/employees/test', (req, res) => {
  res.json({
    success: true,
    message: '🟢 Employee route is working!',
  });
});

// ==============================
// 404 HANDLER (MUST BE LAST)
// ==============================
app.use(notFoundHandler);

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use(errorHandler);

// ==============================
// START SERVER
// ==============================
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});
