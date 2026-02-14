/**
 * Script to assign all departments to a single HOD
 * 
 * This script will:
 * 1. Find or create an HOD user
 * 2. Assign all specified departments to that HOD
 * 3. Display statistics about employees per department
 * 
 * Usage: node backend/scripts/assignDepartmentsToHOD.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Employee = require('../models/Employee');

// Department configuration with employee counts
const DEPARTMENTS = [
  { name: 'Production', expectedCount: 23 },
  { name: 'Marketing', expectedCount: 9 },
  { name: 'Design & Development', expectedCount: 5 },
  { name: 'Quality Assurance', expectedCount: 5 },
  { name: 'Stores', expectedCount: 4 },
  { name: 'Human Resource', expectedCount: 3 },
  { name: 'Purchase', expectedCount: 2 },
  { name: 'Manufacturing Unit', expectedCount: 1 },
  { name: 'Finance & Accounts', expectedCount: 1 }
];

/**
 * Connect to MongoDB
 */
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

/**
 * Get department statistics
 */
const getDepartmentStats = async () => {
  const stats = [];
  
  for (const dept of DEPARTMENTS) {
    const count = await Employee.countDocuments({ 
      department: dept.name,
      empStatus: 'W' // Only working employees
    });
    
    stats.push({
      department: dept.name,
      actualCount: count,
      expectedCount: dept.expectedCount,
      match: count === dept.expectedCount
    });
  }
  
  return stats;
};

/**
 * Find or prompt for HOD user
 */
const getOrCreateHOD = async () => {
  // First, try to find existing HOD users
  const hodUsers = await User.find({ role: 'hod', isActive: true });
  
  if (hodUsers.length === 0) {
    console.log('\n⚠️  No HOD users found in the system.');
    console.log('Please create an HOD user first using the admin panel or seedDefaultUsers script.');
    console.log('Then run this script again.');
    process.exit(1);
  }
  
  if (hodUsers.length === 1) {
    console.log(`\n✅ Found HOD user: ${hodUsers[0].username} (ID: ${hodUsers[0]._id})`);
    return hodUsers[0];
  }
  
  // Multiple HODs found
  console.log('\n📋 Multiple HOD users found:');
  hodUsers.forEach((hod, index) => {
    console.log(`${index + 1}. ${hod.username} (ID: ${hod._id})`);
    if (hod.department) console.log(`   Current department: ${hod.department}`);
    if (hod.departments && hod.departments.length > 0) {
      console.log(`   Current departments: ${hod.departments.join(', ')}`);
    }
  });
  
  console.log('\nℹ️  Using the first HOD for this assignment.');
  return hodUsers[0];
};

/**
 * Assign departments to HOD
 */
const assignDepartments = async (hodUser) => {
  const departmentNames = DEPARTMENTS.map(d => d.name);
  
  // Update the HOD user with all departments
  hodUser.departments = departmentNames;
  
  // Keep the first department as the primary department for backward compatibility
  hodUser.department = departmentNames[0];
  
  await hodUser.save();
  
  console.log('\n✅ Successfully assigned departments to HOD!');
  console.log(`\nHOD User: ${hodUser.username}`);
  console.log(`Primary Department: ${hodUser.department}`);
  console.log(`All Departments (${hodUser.departments.length}):`);
  hodUser.departments.forEach(dept => console.log(`  - ${dept}`));
};

/**
 * Display summary
 */
const displaySummary = async (stats) => {
  console.log('\n📊 Department Statistics:');
  console.log('─'.repeat(70));
  console.log('Department'.padEnd(30) + 'Actual'.padEnd(12) + 'Expected'.padEnd(12) + 'Status');
  console.log('─'.repeat(70));
  
  let totalActual = 0;
  let totalExpected = 0;
  let mismatches = [];
  
  stats.forEach(stat => {
    totalActual += stat.actualCount;
    totalExpected += stat.expectedCount;
    
    const status = stat.match ? '✅' : '⚠️';
    if (!stat.match) {
      mismatches.push(stat);
    }
    
    console.log(
      stat.department.padEnd(30) + 
      stat.actualCount.toString().padEnd(12) + 
      stat.expectedCount.toString().padEnd(12) + 
      status
    );
  });
  
  console.log('─'.repeat(70));
  console.log(
    'TOTAL'.padEnd(30) + 
    totalActual.toString().padEnd(12) + 
    totalExpected.toString().padEnd(12)
  );
  console.log('─'.repeat(70));
  
  if (mismatches.length > 0) {
    console.log('\n⚠️  Departments with count mismatches:');
    mismatches.forEach(stat => {
      const diff = stat.actualCount - stat.expectedCount;
      console.log(`  - ${stat.department}: ${diff > 0 ? '+' : ''}${diff} employees`);
    });
  } else {
    console.log('\n✅ All department counts match expected values!');
  }
  
  console.log('\n💡 Notes:');
  console.log('  - Only "Working" (W) employees are counted');
  console.log('  - Employees can be assigned to departments via the Employee Management interface');
  console.log('  - Leave requests from these departments will now route to the assigned HOD');
  console.log('  - If an employee has no HOD, their leave requests will route to the Director');
};

/**
 * Main execution
 */
const main = async () => {
  try {
    console.log('🚀 Department Assignment Script');
    console.log('═'.repeat(70));
    
    // Connect to database
    await connectDB();
    
    // Get department statistics
    console.log('\n📊 Analyzing department data...');
    const stats = await getDepartmentStats();
    
    // Find or create HOD
    const hodUser = await getOrCreateHOD();
    
    // Assign departments
    await assignDepartments(hodUser);
    
    // Display summary
    await displaySummary(stats);
    
    console.log('\n✅ Script completed successfully!');
    console.log('\n🔗 Next steps:');
    console.log('  1. Verify HOD can see all department employees via GET /api/employees/my-department');
    console.log('  2. Create test leave requests to verify routing to HOD');
    console.log('  3. If needed, you can manually assign different departments to different HODs via the User model');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
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

module.exports = { assignDepartments, getDepartmentStats };

