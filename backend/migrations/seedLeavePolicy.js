const mongoose = require('mongoose');
const LeavePolicy = require('../models/LeavePolicy');
require('dotenv').config();

/**
 * Seed Default Leave Policy based on company requirements:
 * - Leave Year: January-December
 * - Accrual: 1 day/month + 1 bonus every quarter = 15 days/year
 * - Carry Forward: Full balance to next year, resets on new year
 * - No negative balance allowed
 * - 6-day working week (Mon-Sat, full day)
 * - Prorating for new joiners
 */
const seedLeavePolicy = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing policies
    await LeavePolicy.deleteMany({});
    console.log('🗑️  Cleared existing leave policies');

    // Define default leave policy
    const defaultPolicy = {
      policyName: 'Default Company Leave Policy 2024',
      
      // Leave Year: January-December
      leaveYearStartMonth: 1, // January
      leaveYearStartDay: 1,   // 1st
      
      // Default Allocations
      // AL: 1 day/month (12) + 1 bonus every quarter (3) = 15 days/year
      defaultLeaveAllocations: [
        {
          leaveType: 'AL',
          annualAllocation: 15, // 12 months + 3 quarterly bonuses
          accrualType: 'monthly',
          accrualRate: 1 // 1 day per month (+ quarterly bonus handled in accrual logic)
        }
        // Note: Other leave types (PL, CL, SL, etc.) don't have allocations
        // as they are not accrued - they are just categorized unpaid leaves
      ],
      
      // Working Days: 6-day week (Mon-Sat, full day)
      workingDaysPerWeek: 6,
      weekends: ['Sunday'], // Only Sunday is weekend
      
      // Leave Calculation Rules
      includeWeekendsInLeave: false, // Don't count Sundays
      includeHolidaysInLeave: false, // Don't count public holidays
      
      // Carry Forward: Full balance, resets on new year
      maxCarryForwardDays: 999, // No practical limit
      carryForwardExpiryMonths: 0, // No expiry
      resetCarryForwardOnNewYear: true, // Reset on Jan 1
      
      // Encashment: Not allowed
      allowLeaveEncashment: false,
      minServiceYearsForEncashment: 0,
      maxEncashmentDaysPerYear: 0,
      
      // Negative Balance: Not allowed
      allowNegativeBalance: false, // Excess goes to LOP
      maxNegativeBalance: 0,
      
      // Applicability: All employees
      applicableTo: 'All',
      departments: [],
      designations: [],
      
      isDefault: true,
      isActive: true
    };

    // Insert policy
    const policy = await LeavePolicy.create(defaultPolicy);
    console.log('✅ Successfully created default leave policy:');
    console.log(`   Policy Name: ${policy.policyName}`);
    console.log(`   Leave Year: ${policy.leaveYearStartMonth}/1 - ${policy.leaveYearStartMonth === 1 ? 12 : policy.leaveYearStartMonth - 1}/31`);
    console.log(`   AL Allocation: 15 days/year (1/month + 1 bonus/quarter)`);
    console.log(`   Working Days: ${policy.workingDaysPerWeek} days/week (Mon-Sat)`);
    console.log(`   Weekends: ${policy.weekends.join(', ')}`);
    console.log(`   Carry Forward: Full balance, resets on new year`);
    console.log(`   Negative Balance: ${policy.allowNegativeBalance ? 'Allowed' : 'Not Allowed'}`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding leave policy:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  seedLeavePolicy();
}

module.exports = seedLeavePolicy;

