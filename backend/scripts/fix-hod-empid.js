/**
 * 🔧 Database Fix Script
 * 
 * This script fixes existing AssetAssignment records that incorrectly
 * have "HOD" or "DIR" stored in the empId field.
 * 
 * Run with: node scripts/fix-hod-empid.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const AssetAssignment = require('../models/AssetAssignment');

async function fixHodEmpIds() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);

        console.log('✅ Connected to MongoDB');

        // Find all records with "HOD" or "DIR" as empId
        const invalidRecords = await AssetAssignment.find({
            empId: { $in: ['HOD', 'DIR', 'hod', 'dir', 'Director'] }
        });

        console.log(`\n📊 Found ${invalidRecords.length} records to fix\n`);

        // Fix each record
        for (const record of invalidRecords) {
            console.log(`Fixing record: ${record._id}`);
            console.log(`  - Current empId: "${record.empId}"`);
            console.log(`  - assigneeName: "${record.assigneeName}"`);
            console.log(`  - assigneeRole: "${record.assigneeRole}"`);

            // Set empId to null for HOD/Director
            record.empId = null;
            record.employee = null;

            await record.save();
            console.log(`  ✅ Fixed! empId set to null\n`);
        }

        console.log(`\n✅ Successfully fixed ${invalidRecords.length} records`);

        // Verify
        const remaining = await AssetAssignment.find({
            empId: { $in: ['HOD', 'DIR', 'hod', 'dir', 'Director'] }
        });

        if (remaining.length === 0) {
            console.log('✅ Verification: All records fixed successfully!');
        } else {
            console.log(`⚠️ Warning: ${remaining.length} records still need fixing`);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run the fix
fixHodEmpIds();
