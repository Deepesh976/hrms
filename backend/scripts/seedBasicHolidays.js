/**
 * Quick script to seed basic holidays for 2025
 */

const mongoose = require('mongoose');
require('dotenv').config();

const LeaveCalendar = require('../models/LeaveCalendar');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hrms123:hrms123@cluster0.qu6exdn.mongodb.net/?appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const holidays2025 = [
  {
    date: new Date('2025-01-26'),
    title: 'Republic Day',
    description: 'National Holiday',
    type: 'public_holiday',
    applicableTo: 'All',
    department: 'All',
    isWorkingDay: false
  },
  {
    date: new Date('2025-03-14'),
    title: 'Holi',
    description: 'Festival of Colors',
    type: 'public_holiday',
    applicableTo: 'All',
    department: 'All',
    isWorkingDay: false
  },
  {
    date: new Date('2025-04-14'),
    title: 'Dr. Ambedkar Jayanti',
    description: 'National Holiday',
    type: 'public_holiday',
    applicableTo: 'All',
    department: 'All',
    isWorkingDay: false
  },
  {
    date: new Date('2025-08-15'),
    title: 'Independence Day',
    description: 'National Holiday',
    type: 'public_holiday',
    applicableTo: 'All',
    department: 'All',
    isWorkingDay: false
  },
  {
    date: new Date('2025-10-02'),
    title: 'Gandhi Jayanti',
    description: 'National Holiday',
    type: 'public_holiday',
    applicableTo: 'All',
    department: 'All',
    isWorkingDay: false
  },
  {
    date: new Date('2025-10-20'),
    title: 'Dussehra',
    description: 'Festival Holiday',
    type: 'public_holiday',
    applicableTo: 'All',
    department: 'All',
    isWorkingDay: false
  },
  {
    date: new Date('2025-11-01'),
    title: 'Diwali',
    description: 'Festival of Lights',
    type: 'public_holiday',
    applicableTo: 'All',
    department: 'All',
    isWorkingDay: false
  },
  {
    date: new Date('2025-12-25'),
    title: 'Christmas',
    description: 'Christmas Day',
    type: 'public_holiday',
    applicableTo: 'All',
    department: 'All',
    isWorkingDay: false
  }
];

const seedHolidays = async () => {
  try {
    console.log('🌱 Seeding holidays...');
    
    // Clear existing holidays for 2025
    await LeaveCalendar.deleteMany({ year: 2025 });
    console.log('🗑️  Cleared existing 2025 holidays');
    
    // Add year and month to each holiday
    const holidaysWithMetadata = holidays2025.map(holiday => {
      const date = new Date(holiday.date);
      return {
        ...holiday,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
      };
    });
    
    // Insert holidays
    const result = await LeaveCalendar.insertMany(holidaysWithMetadata);
    
    console.log(`✅ Inserted ${result.length} holidays for 2025`);
    console.log('\nHolidays added:');
    result.forEach(h => {
      console.log(`  - ${h.title} (${h.date.toDateString()})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding holidays:', error.message);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await seedHolidays();
    console.log('\n✅ Holiday seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

if (require.main === module) {
  main();
}

module.exports = { seedHolidays };

