/**
 * Migration Script: Update Salary Effective Dates
 * 
 * Purpose: Update all existing SalaryHistory and InputData records
 *          to have March 2026 as the effective date baseline.
 * 
 * Run: node scripts/migrateSalaryEffectiveDates.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const SalaryHistory = require('../models/SalaryHistory');
const InputData = require('../models/InputData');

// Configuration
const EFFECTIVE_FROM_DATE = new Date('2025-03-01'); // March 1, 2025
const EFFECTIVE_FROM_YEAR = 2025;
const EFFECTIVE_FROM_MONTH = 'Mar';

async function migrate() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // ========================================
        // 1️⃣ Update SalaryHistory records
        // ========================================
        console.log('\n📦 Updating SalaryHistory records...');

        const salaryHistoryResult = await SalaryHistory.updateMany(
            {}, // Update all records
            {
                $set: {
                    effectiveFrom: EFFECTIVE_FROM_DATE,
                    effectiveTo: null // Mark as currently active
                }
            }
        );

        console.log(`   ✅ Updated ${salaryHistoryResult.modifiedCount} SalaryHistory records`);

        // ========================================
        // 2️⃣ Update InputData records
        // ========================================
        console.log('\n📦 Updating InputData records...');

        const inputDataResult = await InputData.updateMany(
            {}, // Update all records
            {
                $set: {
                    effectiveFromYear: EFFECTIVE_FROM_YEAR,
                    effectiveFromMonth: EFFECTIVE_FROM_MONTH
                }
            }
        );

        console.log(`   ✅ Updated ${inputDataResult.modifiedCount} InputData records`);

        // ========================================
        // 3️⃣ Verify the updates
        // ========================================
        console.log('\n🔍 Verification:');

        const salaryHistorySample = await SalaryHistory.findOne();
        const inputDataSample = await InputData.findOne();

        if (salaryHistorySample) {
            console.log(`   SalaryHistory sample: effectiveFrom = ${salaryHistorySample.effectiveFrom}`);
        }

        if (inputDataSample) {
            console.log(`   InputData sample: ${inputDataSample.effectiveFromMonth} ${inputDataSample.effectiveFromYear}`);
        }

        // ========================================
        // Summary
        // ========================================
        console.log('\n✅ Migration completed successfully!');
        console.log(`   - SalaryHistory: ${salaryHistoryResult.modifiedCount} records updated`);
        console.log(`   - InputData: ${inputDataResult.modifiedCount} records updated`);
        console.log(`   - Effective Date: March 2026`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run migration
migrate();