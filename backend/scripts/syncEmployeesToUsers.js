/**
 * One-time migration script
 * Purpose:
 * - Ensure EVERY employee has a user account
 * - username = phone number
 * - default password = 123456789
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Employee = require('../models/Employee');
const User = require('../models/User');

const DEFAULT_PASSWORD = '123456789';

async function syncEmployeesToUsers() {
  try {
    /* =========================
       CONNECT DB
    ========================= */
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ DB connected');

    /* =========================
       FETCH EMPLOYEES
    ========================= */
    const employees = await Employee.find({})
      .select('empId empName contactNo')
      .lean();

    console.log(`👥 Employees found: ${employees.length}`);

    let createdCount = 0;
    let skippedCount = 0;

    /* =========================
       LOOP EMPLOYEES
    ========================= */
    for (const emp of employees) {
      // ❌ Skip employees without phone number
      if (!emp.contactNo) {
        skippedCount++;
        continue;
      }

      const phone = String(emp.contactNo);

      // Check if user already exists for this employee
      const existingUser = await User.findOne({
        $or: [
          { employeeId: emp._id },
          { username: phone },
        ],
      });

      if (existingUser) {
        skippedCount++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

      await User.create({
        /* 🔑 AUTH FIELDS */
        username: phone,              // REQUIRED (login)
        password: hashedPassword,

        /* 👤 DISPLAY FIELDS */
        user_name: emp.empName || 'Employee',
        mobile_no: phone,

        /* 🔗 LINKING */
        employeeId: emp._id,
        role: 'employee',
        isActive: true,

        /* 🔐 PASSWORD RULE */
        mustChangePassword: true,
        passwordChangedAt: null,
      });

      createdCount++;
    }

    /* =========================
       RESULT
    ========================= */
    console.log('----------------------------------');
    console.log(`✅ Users created: ${createdCount}`);
    console.log(`⏭️ Users skipped: ${skippedCount}`);
    console.log('🎉 Sync completed successfully');
    console.log('----------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

syncEmployeesToUsers();
