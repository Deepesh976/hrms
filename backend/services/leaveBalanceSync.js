const EmployeeLeaveBalance = require('../models/EmployeeLeaveBalance');
const LeaveTransaction = require('../models/LeaveTransaction');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');

/**
 * Sync leave balances with monthly salary cycle (21st to 20th)
 * This function should be called after salary generation to update leave balances
 * 
 * @param {string} empId - Employee ID
 * @param {number} month - Salary month (1-12)
 * @param {number} year - Salary year
 * @param {Object} leaveData - Leave data from salary calculation
 * @returns {Promise<Object>} - Updated balance
 */
const syncLeaveBalanceForSalaryMonth = async (empId, month, year, leaveData) => {
  try {
    const employee = await Employee.findOne({ empId });
    if (!employee) {
      throw new Error(`Employee ${empId} not found`);
    }

    // Get or create leave balance for the year
    let balance = await EmployeeLeaveBalance.findOne({ empId, year });
    
    if (!balance) {
      // Initialize if doesn't exist
      balance = await EmployeeLeaveBalance.create({
        empId,
        empName: employee.empName,
        year,
        leaveBalances: [{
          leaveType: 'AL',
          leaveTypeName: 'Annual Leave',
          opening: 0,
          allocated: 15, // Default annual allocation
          accrued: 0,
          consumed: 0,
          pending: 0,
          approved: 0,
          balance: 0,
          lapsed: 0,
          carriedForward: 0,
          encashed: 0,
          maxCarryForward: 999,
          maxAccumulation: 999,
          lastAccrualDate: new Date(year, 0, 1),
          nextAccrualDate: new Date(year, 0, 1)
        }]
      });
    }

    let alBalance = balance.leaveBalances.find(lb => lb.leaveType === 'AL');
    
    if (!alBalance) {
      // Add AL balance if doesn't exist
      balance.leaveBalances.push({
        leaveType: 'AL',
        leaveTypeName: 'Annual Leave',
        opening: 0,
        allocated: 15,
        accrued: 0,
        consumed: 0,
        pending: 0,
        approved: 0,
        balance: 0,
        lapsed: 0,
        carriedForward: 0,
        encashed: 0,
        maxCarryForward: 999,
        maxAccumulation: 999,
        lastAccrualDate: new Date(year, 0, 1),
        nextAccrualDate: new Date(year, 0, 1)
      });
      alBalance = balance.leaveBalances[balance.leaveBalances.length - 1];
    }

    const previousBalance = alBalance.balance;

    // Monthly accrual: 1 day per month + 1 bonus on quarters (Mar, Jun, Sep, Dec)
    const isQuarterMonth = [3, 6, 9, 12].includes(month);
    const monthlyAccrual = isQuarterMonth ? 2 : 1;
    
    // Update accrued amount
    alBalance.accrued += monthlyAccrual;
    
    // Add consumption from approved leaves
    const monthlyConsumption = leaveData?.leaveDetails?.al || 0;
    if (monthlyConsumption > 0) {
      alBalance.consumed += monthlyConsumption;
    }
    
    // Calculate new balance (can be negative)
    alBalance.balance = alBalance.accrued - alBalance.consumed;
    
    // Update dates
    alBalance.lastAccrualDate = new Date(year, month - 1, 20); // 20th of salary month
    alBalance.nextAccrualDate = new Date(year, month, 20); // 20th of next month

    await balance.save();

    // Create transactions
    if (monthlyAccrual > 0) {
      await LeaveTransaction.createTransaction({
        empId,
        empName: employee.empName,
        transactionType: 'accrual',
        leaveType: 'AL',
        leaveTypeName: 'Annual Leave',
        previousBalance: previousBalance,
        changeAmount: monthlyAccrual,
        newBalance: previousBalance + monthlyAccrual,
        transactionDate: new Date(year, month - 1, 20),
        effectiveDate: new Date(year, month - 1, 20),
        remarks: `Monthly accrual for ${getMonthName(month)} ${year}${isQuarterMonth ? ' (including quarterly bonus)' : ''}`,
        performedBy: 'system'
      });
    }

    if (monthlyConsumption > 0) {
      await LeaveTransaction.createTransaction({
        empId,
        empName: employee.empName,
        transactionType: 'consumption',
        leaveType: 'AL',
        leaveTypeName: 'Annual Leave',
        previousBalance: previousBalance + monthlyAccrual,
        changeAmount: -monthlyConsumption,
        newBalance: alBalance.balance,
        transactionDate: new Date(year, month - 1, 20),
        effectiveDate: new Date(year, month - 1, 20),
        remarks: `Leave consumption for ${getMonthName(month)} ${year} salary cycle`,
        performedBy: 'system'
      });
    }

    return balance;

  } catch (error) {
    console.error(`Error syncing leave balance for ${empId}:`, error.message);
    throw error;
  }
};

/**
 * Batch sync leave balances for all employees for a specific month
 * Should be called after salary generation completes
 * 
 * @param {number} month - Salary month (1-12)
 * @param {number} year - Salary year
 * @param {Object} salaryData - Array of salary records with leave data
 * @returns {Promise<Object>} - Sync summary
 */
const batchSyncLeaveBalances = async (month, year, salaryData) => {
  console.log(`🔄 Syncing leave balances for ${month}/${year}...`);
  
  const results = {
    success: 0,
    errors: []
  };

  for (const salary of salaryData) {
    try {
      const leaveData = {
        leaveDetails: {
          al: salary.al || 0,
          pl: salary.pl || 0,
          blOrMl: salary.blOrMl || 0
        }
      };

      await syncLeaveBalanceForSalaryMonth(
        salary.empId,
        month,
        year,
        leaveData
      );

      results.success++;
    } catch (error) {
      console.error(`Error syncing ${salary.empId}:`, error.message);
      results.errors.push({
        empId: salary.empId,
        error: error.message
      });
    }
  }

  console.log(`✅ Leave balance sync complete: ${results.success} employees, ${results.errors.length} errors`);
  return results;
};

/**
 * Helper function to get month name
 */
function getMonthName(monthNum) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthNum - 1] || 'Unknown';
}

/**
 * Update leave balance with historical data from migration
 * This handles the monthly breakdown from the leave data file
 * 
 * @param {string} empId - Employee ID
 * @param {number} year - Year
 * @param {Array} monthlyData - Array of {month, consumed} objects
 * @returns {Promise<Object>} - Updated balance
 */
const updateHistoricalLeaveBalance = async (empId, year, monthlyData) => {
  try {
    const employee = await Employee.findOne({ empId });
    if (!employee) {
      console.log(`⚠️  Employee ${empId} not found, skipping`);
      return null;
    }

    let balance = await EmployeeLeaveBalance.findOne({ empId, year });
    
    if (!balance) {
      return null; // Should have been created by migration
    }

    let alBalance = balance.leaveBalances.find(lb => lb.leaveType === 'AL');
    if (!alBalance) {
      return null;
    }

    // Update consumed amount and balance based on historical data
    let totalConsumed = 0;
    for (const monthData of monthlyData) {
      totalConsumed += monthData.consumed;
    }

    alBalance.consumed = totalConsumed;
    alBalance.balance = alBalance.allocated - totalConsumed;

    await balance.save();

    return balance;

  } catch (error) {
    console.error(`Error updating historical balance for ${empId}:`, error.message);
    throw error;
  }
};

module.exports = {
  syncLeaveBalanceForSalaryMonth,
  batchSyncLeaveBalances,
  updateHistoricalLeaveBalance
};

