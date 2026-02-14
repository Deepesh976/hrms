/**
 * Seed Default Users for Role-Based Authentication
 * Run: node seeds/seedDefaultUsers.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

// Default users configuration
const defaultUsers = [
  {
    username: 'admin',
    password: 'Admin@321',
    role: 'super_admin',
    isActive: true,
    mustChangePassword: false,
    email: 'admin@company.com' // Optional
  },
  {
    username: 'hrms_handler',
    password: 'HRMSHandler@321',
    role: 'hrms_handler',
    isActive: true,
    mustChangePassword: false,
    email: 'hrms@company.com' // Optional
  },
  {
    username: 'director',
    password: 'director@321',
    role: 'director',
    isActive: true,
    mustChangePassword: false,
    email: 'director@company.com' // Optional
  },
  {
    username: 'head_of_department',
    password: 'HOD@321',
    role: 'hod',
    department: 'IT', // Change based on your department structure
    isActive: true,
    mustChangePassword: false,
    email: 'hod@company.com' // Optional
  }
];

/**
 * Seed the database with default users
 */
const seedUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ Connected to MongoDB');
    console.log('🔄 Seeding default users...\n');

    let createdCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ username: userData.username });

      if (existingUser) {
        console.log(`⚠️  User "${userData.username}" already exists`);
        
        // Ask if want to update password (you can modify this logic)
        // For now, we'll skip existing users
        skippedCount++;
        
        // Optionally update the user (uncomment to enable)
        // existingUser.password = userData.password; // Will be hashed by pre-save hook
        // existingUser.role = userData.role;
        // existingUser.isActive = userData.isActive;
        // await existingUser.save();
        // updatedCount++;
        // console.log(`✅ Updated user: ${userData.username}`);
      } else {
        // Create new user
        const newUser = new User(userData);
        await newUser.save();
        
        console.log(`✅ Created user: ${userData.username}`);
        console.log(`   - Role: ${userData.role}`);
        console.log(`   - Password: ${userData.password}`);
        if (userData.department) {
          console.log(`   - Department: ${userData.department}`);
        }
        console.log('');
        
        createdCount++;
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    if (updatedCount > 0) {
      console.log(`   🔄 Updated: ${updatedCount}`);
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Default Credentials:');
    console.log('   Super Admin:    admin / Admin@321');
    console.log('   HRMS Handler:   hrms_handler / HRMSHandler@321');
    console.log('   Director:       director / director@321');
    console.log('   Head of Dept:   head_of_department / HOD@321');
    console.log('\n💡 Employee accounts will be created with phone_number / 123456789');
    console.log('   when employees are added to the system.\n');

  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

/**
 * Clear all users (DANGEROUS - use with caution)
 * Uncomment and run if you want to reset all users
 */
const clearUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('⚠️  WARNING: This will delete ALL users!');
    
    const result = await User.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} users`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing users:', error.message);
    process.exit(1);
  }
};

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  console.log('⚠️  CLEAR MODE ACTIVATED');
  clearUsers();
} else {
  seedUsers();
}

