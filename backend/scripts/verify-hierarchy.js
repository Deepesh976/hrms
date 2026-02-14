/**
 * 🔧 Verify & Fix Director-HOD-Employee Relationships
 * 
 * This script checks and fixes the reporting relationships:
 * - HOD Users should have reportsTo pointing to Director
 * - Employees should have reportingToHOD or reportingToDirector
 * 
 * Run with: node scripts/verify-hierarchy.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Employee = require('../models/Employee');

async function verifyAndFixHierarchy() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        /* ======================================
           📊 STEP 1: Find all Directors
        ====================================== */
        const directors = await User.find({ role: 'director' });
        console.log(`📊 Found ${directors.length} Director(s)\n`);

        for (const director of directors) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🎯 DIRECTOR: ${director.name}`);
            console.log(`   ID: ${director._id}`);
            console.log(`   Phone: ${director.phone || 'N/A'}`);
            console.log(`${'='.repeat(60)}\n`);

            /* ======================================
               🔍 STEP 2: Find HODs for this Director
            ====================================== */

            // Find HODs with reportsTo pointing to this director
            const linkedHODs = await User.find({
                role: 'hod',
                reportsTo: director._id,
            });

            console.log(`   📌 HODs with reportsTo = ${director.name}:`);
            if (linkedHODs.length === 0) {
                console.log(`      ⚠️  No HODs found with reportsTo set to this director`);
            } else {
                linkedHODs.forEach(hod => {
                    console.log(`      ✅ ${hod.name} (${hod._id})`);
                });
            }

            // Find HODs WITHOUT reportsTo (orphaned HODs)
            const orphanedHODs = await User.find({
                role: 'hod',
                $or: [
                    { reportsTo: null },
                    { reportsTo: { $exists: false } }
                ]
            });

            if (orphanedHODs.length > 0) {
                console.log(`\n   ⚠️  Orphaned HODs (no reportsTo):`);
                orphanedHODs.forEach(hod => {
                    console.log(`      ❌ ${hod.name} (${hod._id})`);
                });
            }

            /* ======================================
               👥 STEP 3: Find Employees
            ====================================== */

            // Direct employees (reporting to director)
            const directEmployees = await Employee.find({
                reportingToDirector: director._id,
                empStatus: 'W',
            });

            console.log(`\n   👥 Employees reporting DIRECTLY to ${director.name}:`);
            if (directEmployees.length === 0) {
                console.log(`      ℹ️  No direct employees`);
            } else {
                directEmployees.forEach(emp => {
                    console.log(`      ✅ ${emp.empName} (${emp.empId})`);
                });
            }

            // Employees under HODs
            const hodUserIds = linkedHODs.map(h => h._id);
            const hodEmployees = await Employee.find({
                reportingToHOD: { $in: hodUserIds },
                empStatus: 'W',
            });

            console.log(`\n   👥 Employees under HODs:`);
            if (hodEmployees.length === 0) {
                console.log(`      ℹ️  No employees under HODs`);
            } else {
                for (const emp of hodEmployees) {
                    const hod = linkedHODs.find(h => h._id.equals(emp.reportingToHOD));
                    console.log(`      ✅ ${emp.empName} (${emp.empId}) → reports to HOD: ${hod?.name || 'Unknown'}`);
                }
            }

            /* ======================================
               🛠️  STEP 4: Offer to Fix Issues
            ====================================== */

            if (orphanedHODs.length > 0) {
                console.log(`\n   ❓ Would you like to link orphaned HODs to this director?`);
                console.log(`      (Run in interactive mode to fix automatically)`);

                // Auto-fix: Link first orphaned HOD to this director
                if (orphanedHODs.length > 0 && directors.length === 1) {
                    console.log(`\n   🔧 Auto-fixing: Linking orphaned HODs to ${director.name}...`);

                    for (const hod of orphanedHODs) {
                        hod.reportsTo = director._id;
                        await hod.save();
                        console.log(`      ✅ Linked ${hod.name} to ${director.name}`);
                    }
                }
            }
        }

        /* ======================================
           📊 FINAL SUMMARY
        ====================================== */
        console.log(`\n\n${'='.repeat(60)}`);
        console.log(`📊 FINAL SUMMARY`);
        console.log(`${'='.repeat(60)}`);

        const totalHODs = await User.countDocuments({ role: 'hod' });
        const linkedHODsCount = await User.countDocuments({
            role: 'hod',
            reportsTo: { $ne: null }
        });
        const orphanedHODsCount = totalHODs - linkedHODsCount;

        const totalEmployees = await Employee.countDocuments({ empStatus: 'W' });
        const linkedEmployeesCount = await Employee.countDocuments({
            empStatus: 'W',
            $or: [
                { reportingToHOD: { $ne: null } },
                { reportingToDirector: { $ne: null } }
            ]
        });
        const orphanedEmployeesCount = totalEmployees - linkedEmployeesCount;

        console.log(`\n✅ Total HODs: ${totalHODs}`);
        console.log(`   - Linked to Directors: ${linkedHODsCount}`);
        console.log(`   - Orphaned: ${orphanedHODsCount}`);

        console.log(`\n✅ Total Active Employees: ${totalEmployees}`);
        console.log(`   - Linked to HOD/Director: ${linkedEmployeesCount}`);
        console.log(`   - Orphaned: ${orphanedEmployeesCount}`);

        if (orphanedHODsCount === 0 && orphanedEmployeesCount === 0) {
            console.log(`\n🎉 All relationships are properly configured!`);
        } else {
            console.log(`\n⚠️  Some relationships need attention.`);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('\n\n👋 Database connection closed');
    }
}

// Run the verification
verifyAndFixHierarchy();
