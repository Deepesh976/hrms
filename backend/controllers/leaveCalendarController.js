const asyncHandler = require('../middleware/asyncHandler');
const LeaveCalendar = require('../models/LeaveCalendar');

const {
  normalizeDate,
  recalculateActivityForDate,
  rollbackHolidayForDate,
  recalculateAttendanceForDate,
  recalculateMonthlySummary
} = require('../services/holidayImpactService');

/* =========================================================
   GET HOLIDAYS (🔥 EXPLICIT HOLIDAY FLAGS)
========================================================= */
const getHolidays = asyncHandler(async (req, res) => {
  const { year, month, type } = req.query;

  const filter = {};
  if (year) filter.year = parseInt(year, 10);
  if (month) filter.month = parseInt(month, 10);
  if (type) filter.type = type;

  const holidays = await LeaveCalendar.find(filter).sort({ date: 1 });

  // 🔥 IMPORTANT: Frontend must never guess
  const data = holidays.map(h => ({
    ...h.toObject(),
    isHoliday: h.isWorkingDay === false,
    isWorkingDay: false
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

/* =========================================================
   ADD HOLIDAY (🔥 SYNC + GUARANTEED OVERRIDE)
========================================================= */
const addHoliday = asyncHandler(async (req, res) => {
  const { date, title, description, type, isOptional } = req.body;

  if (!date || !title) {
    return res.status(400).json({
      success: false,
      message: 'Date and title are required'
    });
  }

  const dateObj = normalizeDate(date);

  const validTypes = [
    'public_holiday',
    'restricted_holiday',
    'weekend',
    'company_event'
  ];

  const holidayType = type || 'public_holiday';

  if (!validTypes.includes(holidayType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid type. Allowed: ${validTypes.join(', ')}`
    });
  }

  const existing = await LeaveCalendar.findOne({ date: dateObj });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `Holiday already exists for ${dateObj.toDateString()}`
    });
  }

  const holiday = await LeaveCalendar.create({
    date: dateObj,
    title,
    description: description || '',
    type: holidayType,
    isWorkingDay: false,        // 🔒 FORCE NON-WORKING DAY
    isOptional: Boolean(isOptional),
    createdBy: req.user?.email || req.user?.username || 'admin'
  });

  /* 🔥 APPLY HOLIDAY SYSTEM-WIDE (SYNC) */
  await recalculateActivityForDate(dateObj, title);
  await recalculateAttendanceForDate(dateObj);
  await recalculateMonthlySummary(dateObj);

  res.status(201).json({
    success: true,
    message: 'Holiday added successfully',
    data: {
      ...holiday.toObject(),
      isHoliday: true
    }
  });
});

/* =========================================================
   UPDATE HOLIDAY (🔥 SAFE REBUILD)
========================================================= */
const updateHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, type, ...otherFields } = req.body;

  const holiday = await LeaveCalendar.findById(id);
  if (!holiday) {
    return res.status(404).json({
      success: false,
      message: 'Holiday not found'
    });
  }

  const oldDate = normalizeDate(holiday.date);

  if (date) {
    const newDate = normalizeDate(date);

    const duplicate = await LeaveCalendar.findOne({
      _id: { $ne: id },
      date: newDate
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Another holiday already exists for ${newDate.toDateString()}`
      });
    }

    holiday.date = newDate;
  }

  if (type) {
    const validTypes = [
      'public_holiday',
      'restricted_holiday',
      'weekend',
      'company_event'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Allowed: ${validTypes.join(', ')}`
      });
    }

    holiday.type = type;
  }

  Object.assign(holiday, otherFields);
  holiday.isWorkingDay = false; // 🔒 ALWAYS FORCE
  await holiday.save();

  const updatedDate = normalizeDate(holiday.date);

  /* 🔄 ROLLBACK OLD DATE */
  await rollbackHolidayForDate(oldDate);
  await recalculateAttendanceForDate(oldDate);
  await recalculateMonthlySummary(oldDate);

  /* 🔄 APPLY NEW DATE */
  await recalculateActivityForDate(updatedDate, holiday.title);
  await recalculateAttendanceForDate(updatedDate);
  await recalculateMonthlySummary(updatedDate);

  res.status(200).json({
    success: true,
    message: 'Holiday updated successfully',
    data: {
      ...holiday.toObject(),
      isHoliday: true
    }
  });
});

/* =========================================================
   DELETE HOLIDAY (🔥 CLEAN ROLLBACK)
========================================================= */
const deleteHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const holiday = await LeaveCalendar.findByIdAndDelete(id);
  if (!holiday) {
    return res.status(404).json({
      success: false,
      message: 'Holiday not found'
    });
  }

  const deletedDate = normalizeDate(holiday.date);

  /* 🔥 ROLLBACK HOLIDAY EFFECT */
  await rollbackHolidayForDate(deletedDate);
  await recalculateAttendanceForDate(deletedDate);
  await recalculateMonthlySummary(deletedDate);

  res.status(200).json({
    success: true,
    message: 'Holiday deleted and attendance restored'
  });
});

/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
  getHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday
};
