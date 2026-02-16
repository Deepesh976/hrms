const Slip = require('../models/Slip');
const Employee = require('../models/Employee');
const Salary = require('../models/Salary');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper: Flatten object for template replacement
const flattenObject = (obj, parent = '', res = {}) => {
  for (let key in obj) {
    const propName = parent ? `${parent}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};

// Month Name Helper
const getMonthName = (monthNumber) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  return months[monthNumber - 1];
};

/* =========================================
   🔥 ADD THIS RIGHT HERE
========================================= */

const getCycleEndMonth = (year, monthNumber) => {
  const cycleStart = new Date(year, monthNumber - 1, 21);
  const cycleEnd = new Date(cycleStart);
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);
  cycleEnd.setDate(20);

  return {
    month: cycleEnd.getMonth() + 1,
    year: cycleEnd.getFullYear(),
  };
};

// Helper function to convert month name to number
const getMonthNumberFromName = (monthName) => {
  const months = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
  };
  if (!monthName) return NaN;
  return months[String(monthName).toLowerCase()] || parseInt(monthName, 10);
};

// Number to Words Helper
const numberToWords = (num) => {
  if (isNaN(num)) return '';
  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);
  let words = (num < 0 ? 'Negative ' : '') + convertToWords(integerPart);
  if (decimalPart > 0) {
    words += ' and ' + convertToWords(decimalPart) + ' Paise';
  }
  return words;
};

const convertToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      result += teens[n - 10] + ' ';
    } else if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0 && n < 10) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };

  let result = '';
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    result += convertHundreds(num);
  }

  return result.trim();
};

// Generate PDF
const generateSlipPDF = async (slip) => {
  try {
    const templatePath = path.join(__dirname, '../templates/salary-slip-template.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
// ===============================
// 🔥 UNIT-BASED LOGO SELECTION
// ===============================
let logoFile = 'apdp_logo.png'; // default

if (
  slip.empUnit &&
  String(slip.empUnit).trim().toUpperCase() === 'APCP'
) {
  logoFile = 'apcp_logo.png';
}

const logoPath = path.join(__dirname, '../templates', logoFile);

let logoBase64 = '';
if (fs.existsSync(logoPath)) {
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} else {
  console.warn('⚠️ Logo not found:', logoPath);
}


    const flatSlip = flattenObject({
      logoPath: logoBase64,
      month: getMonthName(slip.month).toUpperCase(),
      year: slip.year,
      empName: slip.empName || '',
      designation: slip.designation || '',
      department: slip.department || '',
      dateOfJoining: slip.dateOfJoining
        ? new Date(slip.dateOfJoining).toLocaleDateString('en-GB')
        : '',
      uanNo: slip.uanNo || 'N/A',
      esiNo: slip.esiNo || 'N/A',
      bankAccountNo: slip.bankAccountNo || '',
      totalDays: slip.totalDays || 0,
      daysWorked: slip.daysWorked || 0,
      lop: slip.lop || 0,
      annualLeaves: slip.annualLeaves || 0,
      plMlBl: slip.plMlBl || 0,
      grossEarnings: slip.grossEarnings || 0,
      totalDeductions: slip.totalDeductions || 0,
      netSalary: slip.netSalary || 0,
      netSalaryInWords: numberToWords(slip.netSalary || 0),
      earnings: slip.earnings || {},
      deductions: slip.deductions || {}
    });

    // Replace placeholders
    for (const [key, value] of Object.entries(flatSlip)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      htmlTemplate = htmlTemplate.replace(regex, value);
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

// Create Salary Slip (admin)
exports.createSlip = async (req, res) => {
  try {
    const {
      empId,
      empName,
      empUnit,
      designation,
      department,
      dateOfJoining,
      uanNo,
      esiNo,
      bankAccountNo,
      totalDays,
      daysWorked,
      lop,
      annualLeaves,
      plMlBl,
      earnings,
      deductions
    } = req.body;

    const currentDate = new Date();
    const month = req.body.month || currentDate.getMonth() + 1;
    const year = req.body.year || currentDate.getFullYear();

    let finalEmpUnit = empUnit;
    let finalBankAccountNo = bankAccountNo;

    // Fetch additional details from Employee if not provided
    if (empId) {
      const employee = await Employee.findOne({ empId });
      if (employee) {
        if (!finalEmpUnit) finalEmpUnit = employee.empUnit || '';
        if (!finalBankAccountNo) finalBankAccountNo = employee.bankAccount || '';
        if (!designation && employee.designation) req.body.designation = employee.designation;
        if (!department && employee.department) req.body.department = employee.department;
        if (!dateOfJoining && employee.doj) req.body.dateOfJoining = employee.doj;
        if (!uanNo && employee.uanNo) req.body.uanNo = employee.uanNo;
        if (!esiNo && employee.esiNo) req.body.esiNo = employee.esiNo;
      }
    }

    console.log('Saving Slip with Annual Leaves:', annualLeaves);
    console.log('Saving Slip with PL/ML/BL:', plMlBl);

    const slip = new Slip({
      empId,
      empName,
      empUnit: finalEmpUnit,
      designation: req.body.designation,
      department: req.body.department,
      dateOfJoining: req.body.dateOfJoining,
      uanNo: req.body.uanNo,
      esiNo: req.body.esiNo,
      bankAccountNo: finalBankAccountNo,
      totalDays,
      daysWorked,
      lop,
      annualLeaves,
      plMlBl,
      earnings,
      deductions,
      month,
      year
    });

    await slip.save();

    const pdfBuffer = await generateSlipPDF(slip);

    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `salary_slip_${empName.replace(/\s+/g, '_')}_${month}_${year}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    res.status(201).json({
      message: 'Slip created successfully',
      slip,
      pdfUrl: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Error creating slip:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get all slips (admin)
exports.getAllSlips = async (req, res) => {
  try {
    const slips = await Slip.find().sort({ createdAt: -1 });
    res.json(slips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download slip PDF (admin)
exports.downloadSlipPDF = async (req, res) => {
  try {
    const slip = await Slip.findById(req.params.id);
    if (!slip) return res.status(404).json({ error: 'Slip not found' });

    const pdfBuffer = await generateSlipPDF(slip);
    const fileName = `salary_slip_${slip.empName.replace(/\s+/g, '_')}_${slip.month}_${slip.year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// View slip PDF inline (admin)
exports.viewSlipPDF = async (req, res) => {
  try {
    const slip = await Slip.findById(req.params.id);
    if (!slip) return res.status(404).json({ error: 'Slip not found' });

    const pdfBuffer = await generateSlipPDF(slip);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get slip by ID (admin)
exports.getSlipById = async (req, res) => {
  try {
    const slip = await Slip.findById(req.params.id);
    if (!slip) return res.status(404).json({ error: 'Slip not found' });
    res.json(slip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete slip (admin)
exports.deleteSlip = async (req, res) => {
  try {
    const deleted = await Slip.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Slip not found' });
    res.json({ message: 'Slip deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get salary details for form autofill (admin)
// Supports optional ?month=MM&year=YYYY
exports.getEmployeeSalaryDetails = async (req, res) => {
  try {
    const empId = req.params.empId;
    const { month, year } = req.query;

    const employee = await Employee.findOne({ empId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    let salary;

    if (month && year) {
      const monthNumber =
        typeof month === 'string' && isNaN(month)
          ? getMonthNumberFromName(month)
          : parseInt(month, 10);

      salary = await Salary.findOne({
        empId,
        monthNumber: monthNumber,
        year: parseInt(year, 10)
      });
    } else {
      // Fallback: latest salary if month/year not provided
      salary = await Salary.findOne({ empId }).sort({ year: -1, monthNumber: -1 });
    }

    if (!salary) {
      return res.status(404).json({
        error:
          month && year
            ? `Salary details not found for month ${month} and year ${year}`
            : 'Salary details not found'
      });
    }

    const earnings = {
      basic: salary.basic || salary.BASIC || 0,
      hra: salary.hra || salary.HRA || 0,
      conveyance: salary.cca || salary.CCA || 0,
      transportAllowances: salary.trp_alw || salary.transportAllowance || 0,
      otherAllowances: salary.o_alw1 || salary.otherAllowance1 || 0,
      // incentives: salary.plb || salary.PLB || 0
    };

    const deductions = {
      esi: salary.esi || salary.ESI || 0,
      pf: salary.pf || salary.PF || 0,
      tax: salary.pt || salary.PT || salary.tds || salary.TDS || 0,
      // gpap: salary.gpap || salary.GPAP || 0,
      otherDeductions: salary.otherDeductions || salary.OTH_DEDS || 0,
      lop: salary.lop2 || salary.LOP2 || 0
    };

    res.json({
      employee,
      salary,
      earnings,
      deductions,
      annualLeaves: salary.al || 0,
      plMlBl: (salary.pl || 0) + (salary.blOrMl || 0)
    });
  } catch (error) {
    console.error('Error in getEmployeeSalaryDetails:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get employee's own slips (self-service)
exports.getMySlips = async (req, res) => {
  try {
    const user = req.user;

    const employee = await Employee.findOne({ userId: user.id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found for this user' });
    }

    const slips = await Slip.find({ empId: employee.empId }).sort({ year: -1, month: -1 });

    res.json(slips);
  } catch (error) {
    console.error('Error fetching employee slips:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete employee's own slip (self-service)
exports.deleteMySlip = async (req, res) => {
  try {
    const user = req.user;
    const slipId = req.params.id;

    const employee = await Employee.findOne({ userId: user.id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found for this user' });
    }

    const slip = await Slip.findOne({ _id: slipId, empId: employee.empId });
    if (!slip) {
      return res.status(404).json({ error: 'Slip not found for this employee' });
    }

    await slip.deleteOne();

    res.json({ message: 'Slip deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee slip:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate salary slip for employee (self-service)
exports.generateMySlip = async (req, res) => {
  try {
    const user = req.user;
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const employee = await Employee.findOne({ userId: user.id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found for this user' });
    }

    const empId = employee.empId;

    const monthNumber =
      typeof month === 'string' && isNaN(month)
        ? getMonthNumberFromName(month)
        : parseInt(month, 10);

    const cycleMeta = getCycleEndMonth(parseInt(year, 10), monthNumber);


    // Check if slip already exists for this month/year
    const existingSlip = await Slip.findOne({
      empId,
      month: monthNumber,
      year: parseInt(year, 10)
    });

    if (existingSlip) {
      const pdfBuffer = await generateSlipPDF(existingSlip);
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const fileName = `salary_slip_${existingSlip.empName.replace(
        /\s+/g,
        '_'
      )}_${monthNumber}_${year}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      return res.status(200).json({
        message: 'Salary slip already exists',
        slip: existingSlip,
        pdfUrl: `/uploads/${fileName}`
      });
    }

    const monthName = getMonthName(monthNumber);
    const salary = await Salary.findOne({
      empId,
      monthNumber: monthNumber,
      year: parseInt(year, 10)
    });

    if (!salary) {
      return res.status(404).json({
        error: `No salary data found for ${monthName} ${year}. Please contact HR.`
      });
    }

    const earnings = {
      basic: Math.round(salary.basic || 0),
      hra: Math.round(salary.hra || 0),
      conveyance: Math.round(salary.cca || 0),
      transportAllowances: Math.round(salary.transportAllowance || 0),
      otherAllowances: Math.round(salary.otherAllowance1 || 0),
      // incentives: Math.round(salary.plb || 0)
    };

    const deductions = {
      esi: Math.round(salary.esi || 0),
      pf: Math.round(salary.pf || 0),
      tax: Math.round(salary.pt || salary.tds || 0),
      // gpap: Math.round(salary.gpap || 0),
      otherDeductions: Math.round(salary.otherDeductions || 0),
      lop: Math.round(salary.lop2 || 0)
    };

    const slip = new Slip({
      empId,
      empName: employee.empName,
      empUnit: employee.empUnit,
      designation: employee.designation || salary.designation,
      department: employee.department || salary.department,
      dateOfJoining: employee.doj || salary.doj,
      uanNo: employee.uanNo,
      esiNo: employee.esiNo,
      bankAccountNo: employee.bankAccount,
      totalDays: salary.totalDays || 30,
      daysWorked: salary.daysWorked || salary.daysPaid || 0,
      lop: salary.lop || 0,
      annualLeaves: salary.al || 0,
      plMlBl: (salary.pl || 0) + (salary.blOrMl || 0),
      earnings,
      deductions,
      month: cycleMeta.month,
      year: cycleMeta.year
    });

    await slip.save();

    const pdfBuffer = await generateSlipPDF(slip);
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `salary_slip_${employee.empName.replace(
      /\s+/g,
      '_'
    )}_${monthNumber}_${year}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    res.status(201).json({
      message: 'Salary slip generated successfully',
      slip,
      pdfUrl: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Error generating employee slip:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get available months/years for logged-in employee (self-service)
exports.getMyAvailableSlipPeriods = async (req, res) => {
  try {
    const user = req.user;

    const employee = await Employee.findOne({ userId: user.id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found for this user' });
    }

    const salaries = await Salary.find({ empId: employee.empId })
      .select('month monthNumber year')
      .sort({ year: -1, monthNumber: -1 });

    const periods = salaries.map((s) => ({
      month: s.month,
      monthNumber: s.monthNumber,
      year: s.year
    }));

    res.json({
      employee: {
        empId: employee.empId,
        empName: employee.empName,
        department: employee.department,
        designation: employee.designation
      },
      availablePeriods: periods
    });
  } catch (error) {
    console.error('Error fetching available periods:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get available months/years for a specific employee (admin, used by GenerateSlip)
exports.getEmployeeAvailableSlipPeriods = async (req, res) => {
  try {
    const { empId } = req.params;

    const employee = await Employee.findOne({ empId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const salaries = await Salary.find({ empId: employee.empId })
      .select('month monthNumber year')
      .sort({ year: -1, monthNumber: -1 });

    const periods = salaries.map((s) => {
      let monthNumber = s.monthNumber;

      if (!monthNumber && s.month) {
        monthNumber = getMonthNumberFromName(s.month);
      }

      return {
        month: s.month || getMonthName(monthNumber),
        monthNumber,
        year: s.year
      };
    });

    res.json({
      employee: {
        empId: employee.empId,
        empName: employee.empName
      },
      availablePeriods: periods
    });
  } catch (error) {
    console.error('Error fetching employee periods:', error);
    res.status(500).json({ error: error.message });
  }
};
