const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { flattenObject } = require('./helpers');
const { numberToWords } = require('./numberConverter');
const { getMonthName } = require('./helpers');

/**
 * Generate PDF from HTML template
 * @param {string} htmlContent - HTML content
 * @param {Object} options - PDF options
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generatePDFFromHTML = async (htmlContent, options = {}) => {
  const defaultOptions = {
    format: 'A4',
    printBackground: true,
    margin: { 
      top: '20px', 
      right: '20px', 
      bottom: '20px', 
      left: '20px' 
    }
  };

  const pdfOptions = { ...defaultOptions, ...options };

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf(pdfOptions);
    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

/**
 * Read HTML template file
 * @param {string} templateName - Template filename
 * @returns {string} - HTML content
 */
const readTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../templates', templateName);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }
  
  return fs.readFileSync(templatePath, 'utf8');
};

/**
 * Replace placeholders in template
 * @param {string} template - HTML template
 * @param {Object} data - Data to replace
 * @returns {string} - Processed HTML
 */
const replacePlaceholders = (template, data) => {
  let processedTemplate = template;
  
  // Flatten nested objects
  const flatData = flattenObject(data);
  
  // Replace all placeholders
  for (const [key, value] of Object.entries(flatData)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    processedTemplate = processedTemplate.replace(regex, value || '');
  }
  
  return processedTemplate;
};

/**
 * Load company logo as base64
 * @param {string} logoFileName - Logo filename
 * @returns {string} - Base64 encoded logo
 */
const loadLogoBase64 = (logoFileName = 'company_logo.png') => {
  const logoPath = path.join(__dirname, '../templates', logoFileName);
  
  if (!fs.existsSync(logoPath)) {
    console.warn(`Logo not found: ${logoFileName}`);
    return '';
  }
  
  const logoBuffer = fs.readFileSync(logoPath);
  return `data:image/png;base64,${logoBuffer.toString('base64')}`;
};

/**
 * Save PDF to file
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} fileName - File name
 * @param {string} directory - Directory to save (default: uploads)
 * @returns {string} - Full file path
 */
const savePDFToFile = (pdfBuffer, fileName, directory = 'uploads') => {
  const uploadsDir = path.join(__dirname, '..', directory);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, pdfBuffer);
  
  return filePath;
};

/**
 * Generate salary slip PDF
 * @param {Object} slipData - Salary slip data
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateSalarySlipPDF = async (slipData) => {
  try {
    // Read template
    let htmlTemplate = readTemplate('salary-slip-template.html');
    
    // Load logo
    const logoBase64 = loadLogoBase64();
    
    // Prepare data for template
    const templateData = {
      logoPath: logoBase64,
      month: getMonthName(slipData.month, false).toUpperCase(),
      year: slipData.year,
      empName: slipData.empName || '',
      designation: slipData.designation || '',
      department: slipData.department || '',
      dateOfJoining: slipData.dateOfJoining ? new Date(slipData.dateOfJoining).toLocaleDateString('en-GB') : '',
      uanNo: slipData.uanNo || 'N/A',
      esiNo: slipData.esiNo || 'N/A',
      bankAccountNo: slipData.bankAccountNo || '',
      totalDays: slipData.totalDays || 0,
      daysWorked: slipData.daysWorked || 0,
      lop: slipData.lop || 0,
      annualLeaves: slipData.annualLeaves || 0,
      plMlBl: slipData.plMlBl || 0,
      grossEarnings: slipData.grossEarnings || 0,
      totalDeductions: slipData.totalDeductions || 0,
      netSalary: slipData.netSalary || 0,
      netSalaryInWords: numberToWords(slipData.netSalary || 0),
      earnings: slipData.earnings || {},
      deductions: slipData.deductions || {}
    };
    
    // Replace placeholders
    htmlTemplate = replacePlaceholders(htmlTemplate, templateData);
    
    // Generate PDF
    const pdfBuffer = await generatePDFFromHTML(htmlTemplate);
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating salary slip PDF:', error);
    throw new Error('Failed to generate salary slip PDF: ' + error.message);
  }
};

/**
 * Get PDF file path for salary slip
 * @param {string} empName - Employee name
 * @param {number} month - Month number
 * @param {number} year - Year
 * @returns {string} - File name
 */
const getSalarySlipFileName = (empName, month, year) => {
  const sanitizedName = empName.replace(/\s+/g, '_');
  return `salary_slip_${sanitizedName}_${month}_${year}.pdf`;
};

/**
 * Delete PDF file
 * @param {string} fileName - File name
 * @param {string} directory - Directory (default: uploads)
 * @returns {boolean} - Success status
 */
const deletePDFFile = (fileName, directory = 'uploads') => {
  try {
    const filePath = path.join(__dirname, '..', directory, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting PDF file:', error);
    return false;
  }
};

module.exports = {
  generatePDFFromHTML,
  readTemplate,
  replacePlaceholders,
  loadLogoBase64,
  savePDFToFile,
  generateSalarySlipPDF,
  getSalarySlipFileName,
  deletePDFFile
};

