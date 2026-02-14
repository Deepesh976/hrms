const mongoose = require('mongoose');
const LeaveType = require('../models/LeaveType');
require('dotenv').config();

/**
 * Seed Leave Types - Only 3 types:
 * - AL (Annual Leave) - PAID, accrues monthly + quarterly bonus
 * - CL (Casual Leave) - UNPAID (deducts from salary)
 * - BTL (Business Trip Leave) - PAID upon approval, can be backdated
 */
const seedLeaveTypes = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing leave types
    await LeaveType.deleteMany({});
    console.log('🗑️  Cleared existing leave types');

    // Define only 3 leave types as per requirements
    const leaveTypes = [
      {
        code: 'AL',
        name: 'Annual Leave',
        description: 'Annual earned leaves - PAID leave that accrues monthly with quarterly bonus',
        isPaid: true, // ✅ PAID
        isCarryForwardAllowed: true,
        maxCarryForward: 999,
        accrualType: 'monthly',
        accrualRate: 1, // 1 day per month
        maxAccumulation: 999,
        minDaysAdvance: 0,
        maxConsecutiveDays: 0,
        allowsHalfDay: true,
        minServiceMonths: 0,
        applicableGender: 'All',
        isProratedForNewJoiners: true,
        isProratedForExitEmployees: true,
        requiresDocumentation: false,
        documentationDaysThreshold: 0,
        displayOrder: 1,
        isActive: true
      },
      {
        code: 'CL',
        name: 'Casual Leave',
        description: 'Casual leave - UNPAID (deducts from salary)',
        isPaid: false, // ❌ UNPAID - deducts salary
        isCarryForwardAllowed: false,
        maxCarryForward: 0,
        accrualType: 'none',
        accrualRate: 0,
        maxAccumulation: 0,
        minDaysAdvance: 0,
        maxConsecutiveDays: 0,
        allowsHalfDay: true,
        minServiceMonths: 0,
        applicableGender: 'All',
        isProratedForNewJoiners: false,
        isProratedForExitEmployees: false,
        requiresDocumentation: false,
        documentationDaysThreshold: 0,
        displayOrder: 2,
        isActive: true
      },
      {
        code: 'BTL',
        name: 'Business Trip Leave',
        description: 'Business trip leave - PAID upon approval, can be marked for past dates',
        isPaid: true, // ✅ PAID upon approval
        isCarryForwardAllowed: false,
        maxCarryForward: 0,
        accrualType: 'none',
        accrualRate: 0,
        maxAccumulation: 0,
        minDaysAdvance: 0, // Backdating is allowed via leaveService.js validation logic
        maxConsecutiveDays: 0,
        allowsHalfDay: true,
        minServiceMonths: 0,
        applicableGender: 'All',
        isProratedForNewJoiners: false,
        isProratedForExitEmployees: false,
        requiresDocumentation: false,
        documentationDaysThreshold: 0,
        displayOrder: 3,
        isActive: true
      }
    ];

    // Insert leave types
    const result = await LeaveType.insertMany(leaveTypes);
    console.log(`✅ Successfully created ${result.length} leave types:`);
    result.forEach(lt => {
      console.log(`   - ${lt.code}: ${lt.name} (${lt.isPaid ? 'PAID' : 'UNPAID'})`);
    });

    console.log('\n📝 Summary:');
    console.log('   - AL (Annual Leave): PAID, accrues monthly');
    console.log('   - CL (Casual Leave): UNPAID, deducts from salary');
    console.log('   - BTL (Business Trip Leave): PAID upon approval, backdating allowed');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding leave types:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  seedLeaveTypes();
}

module.exports = seedLeaveTypes;
