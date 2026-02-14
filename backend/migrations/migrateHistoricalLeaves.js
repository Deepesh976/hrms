const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const LeaveRequest = require('../models/LeaveRequest');
const EmployeeLeaveBalance = require('../models/EmployeeLeaveBalance');
const Employee = require('../models/Employee');
const LeaveTransaction = require('../models/LeaveTransaction');
require('dotenv').config();

/**
 * Migrate historical leave consumption data and create LeaveRequest records
 * This ensures salary generation for past months (Aug, Sep, Oct, Nov, Dec) 
 * will correctly use the historical leave data
 * 
 * Format of leaves_data.txt:
 * EmpID  EmpName  Total AL  Aug  Sep  Oct  Nov  Dec  Leave Balance
 * 3      Mr. XYZ  15        8.5  1    0              -5.5
 */
const migrateHistoricalLeaves = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Read leaves_data.txt
    const leavesFilePath = path.join(__dirname, '../../HRMS_07Nov2025/leaves_data.txt');
    
    if (!fs.existsSync(leavesFilePath)) {
      console.error('❌ leaves_data.txt not found at:', leavesFilePath);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(leavesFilePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    console.log(`📄 Found ${dataLines.length} employee records in leaves_data.txt`);

    // Clear existing historical leave requests for 2024 (Aug-Dec)
    console.log('🗑️  Clearing existing historical leave requests for Aug-Dec 2024...');
    await LeaveRequest.deleteMany({
      appliedBy: 'migration_script',
      $or: [
        { startDate: { $gte: new Date(2024, 7, 1), $lte: new Date(2024, 7, 31) } },  // Aug
        { startDate: { $gte: new Date(2024, 8, 1), $lte: new Date(2024, 8, 30) } },  // Sep
        { startDate: { $gte: new Date(2024, 9, 1), $lte: new Date(2024, 9, 31) } },  // Oct
        { startDate: { $gte: new Date(2024, 10, 1), $lte: new Date(2024, 10, 30) } }, // Nov
        { startDate: { $gte: new Date(2024, 11, 1), $lte: new Date(2024, 11, 31) } }  // Dec
      ]
    });

    // Clear existing leave balances
    await EmployeeLeaveBalance.deleteMany({});
    console.log('🗑️  Cleared existing leave balances');

    const currentYear = 2024;
    const results = {
      success: 0,
      skipped: 0,
      errors: [],
      leaveRequestsCreated: 0
    };

    // Month mapping for the data columns (Aug, Sep, Oct, Nov, Dec)
    const monthsData = [
      { name: 'Aug', number: 8, columnIndex: 3 },
      { name: 'Sep', number: 9, columnIndex: 4 },
      { name: 'Oct', number: 10, columnIndex: 5 },
      { name: 'Nov', number: 11, columnIndex: 6 },
      { name: 'Dec', number: 12, columnIndex: 7 }
    ];

    for (const line of dataLines) {
      try {
        // Parse tab-separated values
        const columns = line.split('\t').map(col => col.trim()).filter(col => col);
        
        if (columns.length < 3) {
          console.log(`⚠️  Skipping invalid line: ${line}`);
          results.skipped++;
          continue;
        }

        const empId = columns[0];
        const empName = columns[1];
        const totalAL = parseFloat(columns[2]) || 15;
        
        // Parse monthly consumption
        const monthlyConsumption = [];
        for (let i = 0; i < monthsData.length; i++) {
          const colIndex = monthsData[i].columnIndex;
          const value = parseFloat(columns[colIndex]) || 0;
          monthlyConsumption.push({
            month: monthsData[i].name,
            monthNumber: monthsData[i].number,
            consumed: value
          });
        }
        
        // Calculate total consumed
        const totalConsumed = monthlyConsumption.reduce((sum, m) => sum + m.consumed, 0);
        
        // Calculate balance (can be negative)
        const balance = totalAL - totalConsumed;
        
        console.log(`\n👤 Processing: ${empId} - ${empName}`);
        console.log(`   Total AL: ${totalAL}, Consumed: ${totalConsumed}, Balance: ${balance}`);
        console.log(`   Monthly: ${monthlyConsumption.map(m => `${m.month}=${m.consumed}`).join(', ')}`);

        // Check if employee exists
        const employee = await Employee.findOne({ 
          $or: [
            { empId: empId },
            { empId: empId.toString() }
          ]
        });

        if (!employee) {
          console.log(`   ⚠️  Employee not found in database, skipping leave requests`);
        }

        // Create LeaveRequest records for each month with consumption > 0
        let leaveRequestsForEmployee = 0;
        for (const monthData of monthlyConsumption) {
          if (monthData.consumed > 0) {
            const monthNum = monthData.monthNumber;
            const year = currentYear;
            
            // Create leave request for the month
            // Use dates in the middle of the month for simplicity
            const startDate = new Date(year, monthNum - 1, 10);
            const endDate = new Date(year, monthNum - 1, 10 + Math.ceil(monthData.consumed) - 1);
            
            const leaveRequest = await LeaveRequest.create({
              empId: empId,
              empName: empName,
              department: employee ? employee.department : '',
              leaveType: 'AL',
              leaveTypeName: 'Annual Leave',
              startDate: startDate,
              endDate: endDate,
              isHalfDay: (monthData.consumed % 1 !== 0), // If decimal, mark as half day
              halfDaySession: (monthData.consumed % 1 !== 0) ? 'first_half' : null,
              totalDays: monthData.consumed,
              reason: `Historical leave consumption for ${monthData.month} 2024 (from migration)`,
              contactDuringLeave: '',
              status: 'approved',
              approverRole: 'hrms_handler',
              appliedAt: new Date(year, monthNum - 1, 1),
              appliedBy: 'migration_script',
              reviewedBy: 'system',
              reviewedAt: new Date(year, monthNum - 1, 2),
              decisionComment: 'Historical data migrated from leaves_data.txt',
              balanceBeforeRequest: 0,
              balanceAfterRequest: 0,
              isAppliedToSalary: false, // Will be set to true when salary is generated
              salaryMonth: monthNum,
              salaryYear: year
            });

            console.log(`   ✅ Created LeaveRequest for ${monthData.month}: ${monthData.consumed} days (${leaveRequest.leaveRequestId})`);
            leaveRequestsForEmployee++;
            results.leaveRequestsCreated++;
          }
        }

        // Create EmployeeLeaveBalance with current state
        const leaveBalance = await EmployeeLeaveBalance.create({
          empId: empId,
          empName: empName,
          year: currentYear,
          leaveBalances: [{
            leaveType: 'AL',
            leaveTypeName: 'Annual Leave',
            
            opening: 0,
            allocated: totalAL,
            accrued: totalAL, // For historical data, assume all allocated upfront
            
            consumed: totalConsumed,
            pending: 0,
            approved: 0,
            
            balance: balance, // Can be negative
            lapsed: 0,
            carriedForward: 0,
            encashed: 0,
            
            maxCarryForward: 999,
            maxAccumulation: 999,
            
            lastAccrualDate: new Date(currentYear, 11, 31),
            nextAccrualDate: new Date(currentYear + 1, 0, 1)
          }]
        });

        // Create summary transaction
        await LeaveTransaction.createTransaction({
          empId: empId,
          empName: empName,
          transactionType: 'adjustment',
          leaveType: 'AL',
          leaveTypeName: 'Annual Leave',
          previousBalance: totalAL,
          changeAmount: -totalConsumed,
          newBalance: balance,
          leaveRequestId: null,
          transactionDate: new Date(),
          effectiveDate: new Date(currentYear, 0, 1),
          remarks: `Historical migration: Allocated ${totalAL}, Consumed ${totalConsumed}, Balance ${balance}. Created ${leaveRequestsForEmployee} leave requests.`,
          performedBy: 'migration_script',
          performedAt: new Date()
        });

        console.log(`   ✅ Created ${leaveRequestsForEmployee} leave requests and balance record`);
        if (balance < 0) {
          console.log(`   ⚠️  WARNING: Over-consumed by ${Math.abs(balance)} days`);
        }

        results.success++;

      } catch (error) {
        console.error(`   ❌ Error processing line: ${line}`);
        console.error(`   Error: ${error.message}`);
        results.errors.push({ line, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successfully migrated: ${results.success} employees`);
    console.log(`📝 Leave requests created: ${results.leaveRequestsCreated}`);
    console.log(`⚠️  Skipped: ${results.skipped} records`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.error}`);
      });
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Generate salary for August: It will use the historical leave data');
    console.log('   2. Generate salary for September: It will use the historical leave data');
    console.log('   3. Generate salary for October: It will use the historical leave data');
    console.log('   4. The LeaveRequest records will be marked as isAppliedToSalary=true');
    console.log('   5. Leave balances will be updated accordingly');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  migrateHistoricalLeaves();
}

module.exports = migrateHistoricalLeaves;

