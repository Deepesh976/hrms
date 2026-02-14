const mongoose = require('mongoose');
const LeaveCalendar = require('../models/LeaveCalendar');
require('dotenv').config();

/**
 * Seed Leave Calendar with public holidays for 2024-2025
 * Note: 6-day work week (Mon-Sat), Sunday is weekend
 */
const seedLeaveCalendar = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing calendar
    await LeaveCalendar.deleteMany({});
    console.log('🗑️  Cleared existing leave calendar');

    // Define public holidays for 2024-2025 (India)
    const holidays = [
      // 2024 Holidays (Remaining)
      { date: '2024-12-25', title: 'Christmas', type: 'public_holiday', isWorkingDay: false },
      
      // 2025 Holidays
      { date: '2025-01-01', title: 'New Year', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-01-26', title: 'Republic Day', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-03-14', title: 'Holi', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-04-10', title: 'Id-ul-Fitr', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-04-18', title: 'Good Friday', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-05-01', title: 'May Day', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-08-15', title: 'Independence Day', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-10-02', title: 'Gandhi Jayanti', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-10-20', title: 'Dussehra', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-11-01', title: 'Diwali', type: 'public_holiday', isWorkingDay: false },
      { date: '2025-12-25', title: 'Christmas', type: 'public_holiday', isWorkingDay: false },
      
      // Optional/Restricted Holidays (can be taken if approved)
      { date: '2025-03-01', title: 'Maha Shivaratri', type: 'restricted_holiday', isWorkingDay: false, isOptional: true },
      { date: '2025-06-16', title: 'Id-ul-Zuha', type: 'restricted_holiday', isWorkingDay: false, isOptional: true },
      { date: '2025-08-27', title: 'Janmashtami', type: 'restricted_holiday', isWorkingDay: false, isOptional: true },
    ];

    const results = [];
    for (const holiday of holidays) {
      const holidayDate = new Date(holiday.date);
      
      const holidayDoc = await LeaveCalendar.create({
        date: holidayDate,
        year: holidayDate.getFullYear(),
        month: holidayDate.getMonth() + 1,
        type: holiday.type,
        title: holiday.title,
        description: holiday.description || '',
        isWorkingDay: holiday.isWorkingDay,
        isOptional: holiday.isOptional || false,
        applicableTo: 'All',
        department: 'All',
        unit: '',
        isWeekend: false,
        weekendType: null,
        createdBy: 'system'
      });
      
      results.push(holidayDoc);
      console.log(`✅ Added: ${holiday.date} - ${holiday.title} (${holiday.type})`);
    }

    console.log(`\n✅ Successfully created ${results.length} holiday entries`);
    console.log('\n📝 Note: Weekends (Sundays) are handled programmatically in working days calculation');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding leave calendar:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  seedLeaveCalendar();
}

module.exports = seedLeaveCalendar;

