/**
 * Migration Script: Department-based to Hierarchical Assignment System
 * 
 * This script migrates from the old department-based HOD system to the new
 * hierarchical employee assignment system.
 * 
 * Usage: node backend/migrations/migrateToHierarchicalSystem.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Step 1: Migrate HODs from department-based to employee assignment
 */
const migrateHODs = async () => {
  console.log('\n📋 Step 1: Migrating HODs from department-based to employee assignments...');
  
  const hods = await User.find({ role: 'hod', isActive: true });
  
  if (hods.length === 0) {
    console.log('   ℹ️  No HODs found. Skipping HOD migration.');
    return;
  }
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const hod of hods) {
    try {
      // Get departments from old fields
      const oldDepartments = [];
      if (hod.department) {
        oldDepartments.push(hod.department);
      }
      if (hod.departments && hod.departments.length > 0) {
        oldDepartments.push(...hod.departments);
      }
      
      // Remove duplicates
      const uniqueDepartments = [...new Set(oldDepartments)];
      
      if (uniqueDepartments.length === 0) {
        console.log(`   ⚠️  HOD ${hod.username} has no departments assigned. Skipping.`);
        skippedCount++;
        continue;
      }
      
      // Find employees in these departments
      const employees = await Employee.find({
        department: { $in: uniqueDepartments },
        empStatus: 'W'
      });
      
      if (employees.length === 0) {
        console.log(`   ℹ️  HOD ${hod.username} (Departments: ${uniqueDepartments.join(', ')}) - No employees found`);
        
        // Clear old fields
        hod.department = undefined;
        hod.departments = undefined;
        hod.assignedEmployees = [];
        await hod.save();
        
        skippedCount++;
        continue;
      }
      
      // Assign employees to HOD
      hod.assignedEmployees = employees.map(emp => emp._id);
      
      // Clear old department fields
      hod.department = undefined;
      hod.departments = undefined;
      
      await hod.save();
      
      // Update employees to point to this HOD
      for (const employee of employees) {
        employee.reportingToHOD = hod._id;
        employee.reportingToDirector = null; // Clear any old director assignment
        // Clear old reportingTo field if it exists
        if (employee.reportingTo) {
          employee.reportingTo = undefined;
        }
        await employee.save();
      }
      
      console.log(`   ✅ HOD ${hod.username} - Assigned ${employees.length} employees from departments: ${uniqueDepartments.join(', ')}`);
      migratedCount++;
      
    } catch (error) {
      console.error(`   ❌ Error migrating HOD ${hod.username}:`, error.message);
    }
  }
  
  console.log(`\n   📊 HOD Migration Summary:`);
  console.log(`      - Migrated: ${migratedCount}`);
  console.log(`      - Skipped: ${skippedCount}`);
  console.log(`      - Total: ${hods.length}`);
};

/**
 * Step 2: Update existing leave requests with hierarchical approval
 */
const migrateLeaveRequests = async () => {
  console.log('\n📋 Step 2: Migrating pending leave requests to hierarchical approval system...');
  
  const pendingLeaves = await LeaveRequest.find({ 
    status: 'pending',
    $or: [
      { currentApprover: { $exists: false } },
      { currentApprover: null }
    ]
  });
  
  if (pendingLeaves.length === 0) {
    console.log('   ℹ️  No pending leave requests to migrate.');
    return;
  }
  
  let migratedCount = 0;
  let errorCount = 0;
  
  for (const leave of pendingLeaves) {
    try {
      const employee = await Employee.findOne({ empId: leave.empId });
      
      if (!employee) {
        console.log(`   ⚠️  Employee ${leave.empId} not found for leave request ${leave.leaveRequestId}`);
        errorCount++;
        continue;
      }
      
      // Determine current approver based on new hierarchy
      const { determineLeaveApprover } = require('../services/hierarchyService');
      const approverInfo = await determineLeaveApprover(employee._id);
      
      // Update leave request
      leave.currentApprover = approverInfo.approverId;
      leave.currentApproverRole = approverInfo.approverRole;
      
      // Update approval chain if not exists
      if (!leave.approvalChain || leave.approvalChain.length === 0) {
        leave.approvalChain = [{
          approverRole: approverInfo.approverRole,
          approverId: approverInfo.approverId,
          approverName: approverInfo.approverName,
          action: 'pending',
          reviewedAt: null,
          comment: null
        }];
      }
      
      // Update legacy fields for backward compatibility
      leave.approverRole = approverInfo.approverRole;
      leave.approverId = approverInfo.approverId;
      
      await leave.save();
      
      migratedCount++;
      
    } catch (error) {
      console.error(`   ❌ Error migrating leave request ${leave.leaveRequestId}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n   📊 Leave Request Migration Summary:`);
  console.log(`      - Migrated: ${migratedCount}`);
  console.log(`      - Errors: ${errorCount}`);
  console.log(`      - Total: ${pendingLeaves.length}`);
};

/**
 * Step 3: Generate migration report
 */
const generateReport = async () => {
  console.log('\n📊 Migration Report:');
  console.log('='.repeat(70));
  
  // HODs
  const hodCount = await User.countDocuments({ role: 'hod', isActive: true });
  const hodsWithEmployees = await User.countDocuments({ 
    role: 'hod', 
    isActive: true,
    assignedEmployees: { $exists: true, $ne: [] }
  });
  
  console.log(`\n📋 HODs:`);
  console.log(`   - Total HODs: ${hodCount}`);
  console.log(`   - HODs with employees: ${hodsWithEmployees}`);
  console.log(`   - HODs without employees: ${hodCount - hodsWithEmployees}`);
  
  // Directors
  const directorCount = await User.countDocuments({ role: 'director', isActive: true });
  console.log(`\n🎯 Directors:`);
  console.log(`   - Total Directors: ${directorCount}`);
  
  // Employees
  const totalEmployees = await Employee.countDocuments({ empStatus: 'W' });
  const employeesWithHOD = await Employee.countDocuments({ 
    empStatus: 'W',
    reportingToHOD: { $ne: null }
  });
  const employeesWithDirector = await Employee.countDocuments({ 
    empStatus: 'W',
    reportingToDirector: { $ne: null }
  });
  const unassignedEmployees = totalEmployees - employeesWithHOD - employeesWithDirector;
  
  console.log(`\n👥 Employees:`);
  console.log(`   - Total working employees: ${totalEmployees}`);
  console.log(`   - Assigned to HOD: ${employeesWithHOD}`);
  console.log(`   - Assigned to Director (direct): ${employeesWithDirector}`);
  console.log(`   - Unassigned: ${unassignedEmployees}`);
  
  if (unassignedEmployees > 0) {
    console.log(`\n   ⚠️  Warning: ${unassignedEmployees} employees are not assigned to any HOD or Director!`);
    console.log('      Please assign them using the Manage HODs or Manage Directors interface.');
  }
  
  // Leave Requests
  const pendingLeaves = await LeaveRequest.countDocuments({ status: 'pending' });
  const leavesWithApprover = await LeaveRequest.countDocuments({
    status: 'pending',
    currentApprover: { $ne: null }
  });
  
  console.log(`\n📝 Leave Requests:`);
  console.log(`   - Pending leave requests: ${pendingLeaves}`);
  console.log(`   - With assigned approver: ${leavesWithApprover}`);
  console.log(`   - Without approver: ${pendingLeaves - leavesWithApprover}`);
  
  console.log('\n' + '='.repeat(70));
};

/**
 * Rollback function (for testing)
 */
const rollback = async () => {
  console.log('\n⚠️  ROLLBACK MODE - This will revert the migration!');
  console.log('This feature is for testing only.');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('Are you sure you want to rollback? (yes/no): ', async (answer) => {
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Rollback cancelled.');
        resolve();
        return;
      }
      
      console.log('Rolling back...');
      
      // Clear HOD assignments
      await User.updateMany(
        { role: 'hod' },
        { 
          $set: { assignedEmployees: [] },
          $unset: { reportsTo: 1 }
        }
      );
      
      // Clear employee assignments
      await Employee.updateMany(
        {},
        { 
          $unset: { reportingToHOD: 1, reportingToDirector: 1 }
        }
      );
      
      // Clear leave request approval chains
      await LeaveRequest.updateMany(
        {},
        {
          $unset: { currentApprover: 1, currentApproverRole: 1, approvalChain: 1 }
        }
      );
      
      console.log('✅ Rollback completed.');
      resolve();
    });
  });
};

/**
 * Main execution
 */
const main = async () => {
  try {
    console.log('🚀 HRMS Hierarchical System Migration');
    console.log('='.repeat(70));
    console.log('This script will migrate from department-based to hierarchical system.');
    console.log('='.repeat(70));
    
    // Check for rollback flag
    if (process.argv.includes('--rollback')) {
      await connectDB();
      await rollback();
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
      return;
    }
    
    // Connect to database
    await connectDB();
    
    // Run migration steps
    await migrateHODs();
    await migrateLeaveRequests();
    await generateReport();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review the migration report above');
    console.log('   2. Assign any unassigned employees using the Manage HODs interface');
    console.log('   3. Create and assign Directors using the Manage Directors interface');
    console.log('   4. Test the leave request workflow');
    console.log('\n💡 Tips:');
    console.log('   - You can run this script multiple times safely');
    console.log('   - Use --rollback flag to undo the migration (for testing)');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { migrateHODs, migrateLeaveRequests, generateReport };

