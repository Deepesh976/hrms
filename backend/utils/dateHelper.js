const { APP_CONSTANTS } = require('./constants');

/**
 * Parse Excel date (serial number or string) to JavaScript Date
 * @param {*} cellDate - Excel date value
 * @returns {Date|null}
 */
const parseExcelDate = (cellDate) => {
  // Excel serial date number (days since 1900-01-01)
  if (typeof cellDate === 'number' && cellDate > 40000 && cellDate < 50000) {
    return new Date((cellDate - 25569) * 86400 * 1000);
  }
  
  // String date formats
  if (typeof cellDate === 'string') {
    const dateStr = cellDate.trim();
    
    // Handle format: 21-Apr, 22-Apr, etc.
    const monthMatch = dateStr.match(/(\d{1,2})-?([A-Za-z]{3})/);
    if (monthMatch) {
      const day = parseInt(monthMatch[1]);
      const monthAbbr = monthMatch[2].toLowerCase();
      
      const monthMap = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
      };
      
      const monthNum = monthMap[monthAbbr];
      if (monthNum && day >= 1 && day <= 31) {
        return new Date(new Date().getFullYear(), monthNum - 1, day);
      }
    }
    
    // Try standard date parsing
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  
  return null;
};

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 * @param {Date} date - Date object
 * @returns {number}
 */
const getDayOfWeek = (date) => {
  return date.getDay();
};

/**
 * Check if date is weekend (Sunday)
 * @param {Date} date - Date object
 * @returns {boolean}
 */
const isWeekend = (date) => {
  return date.getDay() === 0; // Sunday
};

/**
 * Check if date is weekday
 * @param {Date} date - Date object
 * @returns {boolean}
 */
const isWeekday = (date) => {
  return !isWeekend(date);
};

/**
 * Get date range for a month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} - { startDate, endDate, totalDays }
 */
const getMonthDateRange = (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const totalDays = endDate.getDate();
  
  return { startDate, endDate, totalDays };
};

/**
 * Get month and year from date
 * @param {Date} date - Date object
 * @returns {Object} - { year, month, monthName }
 */
const getMonthYear = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthName = APP_CONSTANTS.MONTH_NAMES[date.getMonth()];
  
  return { year, month, monthName };
};

/**
 * Calculate number of days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number}
 */
const daysBetween = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((endDate - startDate) / oneDay));
};

/**
 * Add days to a date
 * @param {Date} date - Original date
 * @param {number} days - Number of days to add
 * @returns {Date}
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add months to a date
 * @param {Date} date - Original date
 * @param {number} months - Number of months to add
 * @returns {Date}
 */
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean}
 */
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Get start of day (00:00:00)
 * @param {Date} date - Date object
 * @returns {Date}
 */
const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get end of day (23:59:59)
 * @param {Date} date - Date object
 * @returns {Date}
 */
const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string}
 */
const formatDateISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

/**
 * Format date to DD/MM/YYYY
 * @param {Date} date - Date object
 * @returns {string}
 */
const formatDateDDMMYYYY = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Get current financial year (April to March)
 * @returns {Object} - { startYear, endYear, label }
 */
const getCurrentFinancialYear = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  let startYear, endYear;
  
  if (currentMonth >= 4) {
    // April to December
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    // January to March
    startYear = currentYear - 1;
    endYear = currentYear;
  }
  
  return {
    startYear,
    endYear,
    label: `${startYear}-${endYear}`
  };
};

module.exports = {
  parseExcelDate,
  getDayOfWeek,
  isWeekend,
  isWeekday,
  getMonthDateRange,
  getMonthYear,
  daysBetween,
  addDays,
  addMonths,
  isSameDay,
  startOfDay,
  endOfDay,
  formatDateISO,
  formatDateDDMMYYYY,
  getCurrentFinancialYear
};

