const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const EmployeeLeaveBalance = require('../models/EmployeeLeaveBalance');
const Employee = require('../models/Employee');
const LeaveTransaction = require('../models/LeaveTransaction');
require('dotenv').config();

/**
 * Parse leaves_data.txt and migrate to EmployeeLeaveBalance collection
 * 
 * Format of leaves_data.txt:
 * EmpID  EmpName  Total AL  Aug  Sep  Oct  Nov  Dec  Leave Balance
 * 3      Mr. BUDIDHA MAHALINGAM  15  8.5  1  0      -5.5
 */
const migrateLeaveData = async () => {
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

    // Clear existing leave balances
    await EmployeeLeaveBalance.deleteMany({});
    console.log('🗑️  Cleared existing leave balances');

    const currentYear = 2024; // Using 2024 as base year for migration
    const results = {
      success: 0,
      skipped: 0,
      errors: []
    };

    // Month mapping for the data columns (Aug, Sep, Oct, Nov, Dec)
    const monthNames = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNumbers = [8, 9, 10, 11, 12]; // August = 8, September = 9, etc.

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
        
        // Parse monthly consumption (Aug, Sep, Oct, Nov, Dec)
        const monthlyConsumption = [];
        for (let i = 3; i < Math.min(columns.length - 1, 8); i++) {
          const value = parseFloat(columns[i]) || 0;
          monthlyConsumption.push(value);
        }
        
        // Calculate total consumed
        const totalConsumed = monthlyConsumption.reduce((sum, val) => sum + val, 0);
        
        // Calculate balance (can be negative - this represents over-consumption)
        const balance = totalAL - totalConsumed;
        
        console.log(`\n👤 Processing: ${empId} - ${empName}`);
        console.log(`   Total AL: ${totalAL}, Consumed: ${totalConsumed}, Balance: ${balance}`);
        console.log(`   Monthly breakdown:`, monthlyConsumption.map((v, i) => `${monthNames[i]}: ${v}`).join(', '));

        // Check if employee exists in Employee collection
        const employee = await Employee.findOne({ 
          $or: [
            { empId: empId },
            { empId: empId.toString() }
          ]
        });

        if (!employee) {
          console.log(`   ⚠️  Employee not found in database, creating balance anyway`);
        }

        // Create EmployeeLeaveBalance - ALLOW NEGATIVE BALANCE
        const leaveBalance = await EmployeeLeaveBalance.create({
          empId: empId,
          empName: empName,
          year: currentYear,
          leaveBalances: [
            {
              leaveType: 'AL',
              leaveTypeName: 'Annual Leave',
              
              opening: 0, // No opening balance (first year)
              allocated: totalAL,
              accrued: totalAL,
              
              consumed: totalConsumed,
              pending: 0,
              approved: 0,
              
              balance: balance, // Store actual balance (can be negative)
              lapsed: 0,
              carriedForward: 0,
              encashed: 0,
              
              maxCarryForward: 999,
              maxAccumulation: 999,
              
              lastAccrualDate: new Date(currentYear, 11, 31), // Dec 31, 2024
              nextAccrualDate: new Date(currentYear + 1, 0, 1) // Jan 1, 2025
            }
          ]
        });

        // Create monthly consumption transactions for audit trail
        let runningBalance = totalAL; // Start with allocated amount
        for (let i = 0; i < monthlyConsumption.length; i++) {
          const consumed = monthlyConsumption[i];
          if (consumed > 0) {
            const monthNum = monthNumbers[i];
            const prevBalance = runningBalance;
            runningBalance -= consumed;
            
            await LeaveTransaction.createTransaction({
              empId: empId,
              empName: empName,
              transactionType: 'consumption',
              leaveType: 'AL',
              leaveTypeName: 'Annual Leave',
              previousBalance: prevBalance,
              changeAmount: -consumed,
              newBalance: runningBalance,
              leaveRequestId: null,
              transactionDate: new Date(currentYear, monthNum - 1, 20), // 20th of each month
              effectiveDate: new Date(currentYear, monthNum - 1, 20),
              remarks: `Historical leave consumption for ${monthNames[i]} 2024 (from migration)`,
              performedBy: 'system',
              performedAt: new Date()
            });
          }
        }

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
          remarks: `Migration summary: Allocated ${totalAL}, Consumed ${totalConsumed}, Balance ${balance}${balance < 0 ? ' (Over-consumed by ' + Math.abs(balance) + ' days)' : ''}`,
          performedBy: 'system',
          performedAt: new Date()
        });

        console.log(`   ✅ Created leave balance for ${empId}`);
        if (balance < 0) {
          console.log(`   ⚠️  Note: Over-consumed by ${Math.abs(balance)} days - balance is negative`);
        }

        results.success++;

      } catch (error) {
        console.error(`   ❌ Error processing employee ${line}:`, error.message);
        results.errors.push({ line, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${results.success} employees`);
    console.log(`⚠️  Skipped: ${results.skipped} records`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.line}: ${err.error}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  migrateLeaveData();
}

module.exports = migrateLeaveData;

