#!/usr/bin/env node

/**
 * Master Migration Runner
 * Runs all leave management migrations in the correct order
 */

const seedLeaveTypes = require('./seedLeaveTypes');
const seedLeavePolicy = require('./seedLeavePolicy');
const seedLeaveCalendar = require('./seedLeaveCalendar');
const migrateHistoricalLeaves = require('./migrateHistoricalLeaves');

const runAllMigrations = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 LEAVE MANAGEMENT SYSTEM - MIGRATION & SEEDING');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Seed Leave Types
    console.log('📌 Step 1: Seeding Leave Types...\n');
    await seedLeaveTypes();
    console.log('\n✅ Step 1 Complete!\n');
    await sleep(2000);

    // Step 2: Seed Leave Policy
    console.log('📌 Step 2: Seeding Leave Policy...\n');
    await seedLeavePolicy();
    console.log('\n✅ Step 2 Complete!\n');
    await sleep(2000);

    // Step 3: Seed Leave Calendar (Holidays)
    console.log('📌 Step 3: Seeding Leave Calendar (Public Holidays)...\n');
    await seedLeaveCalendar();
    console.log('\n✅ Step 3 Complete!\n');
    await sleep(2000);

    // Step 4: Migrate Historical Leave Data and Create Leave Requests
    console.log('📌 Step 4: Migrating Historical Leave Data and Creating Leave Requests...\n');
    await migrateHistoricalLeaves();
    console.log('\n✅ Step 4 Complete!\n');

    // Success Summary
    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n✅ Leave Types created');
    console.log('✅ Leave Policy configured');
    console.log('✅ Public Holidays added');
    console.log('✅ Employee Leave Balances migrated');
    console.log('✅ Historical Leave Requests created for Aug-Dec 2024');
    console.log('\n📝 Next Steps:');
    console.log('   1. Verify data in MongoDB (check LeaveRequest collection)');
    console.log('   2. Generate salary for Aug, Sep, Oct, Nov, Dec');
    console.log('   3. Historical leave data will be automatically applied');
    console.log('   4. Test leave request APIs for new leaves');
    console.log('\n');

    process.exit(0);

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ MIGRATION FAILED');
    console.error('='.repeat(70));
    console.error('\nError:', error.message);
    console.error('\nPlease fix the error and run the migration again.\n');
    process.exit(1);
  }
};

// Helper function to pause between steps
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run if executed directly
if (require.main === module) {
  runAllMigrations();
}

module.exports = runAllMigrations;

