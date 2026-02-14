const { APP_CONSTANTS } = require('./constants');

/**
 * Safely convert value to number, returns 0 if invalid
 * @param {*} val - Value to convert
 * @returns {number}
 */
const safe = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

/**
 * Normalize string to lowercase and trim
 * @param {*} str - String to normalize
 * @returns {string}
 */
const normalizeString = (str) => {
  return String(str || '').trim().toLowerCase();
};

/**
 * Normalize employee ID
 * @param {*} empId - Employee ID to normalize
 * @returns {string}
 */
const normalizeEmpId = (empId) => {
  return String(empId || '').trim().toLowerCase();
};

/**
 * Format phone number - keep only last 10 digits
 * @param {*} phone - Phone number to format
 * @returns {string}
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-10);
};

/**
 * Format bank account number - remove non-digits
 * @param {*} account - Account number to format
 * @returns {string}
 */
const formatBankAccount = (account) => {
  if (!account) return '';
  return String(account).replace(/[^\d]/g, '');
};

/**
 * Normalize gender value
 * @param {*} gender - Gender value
 * @returns {string}
 */
const normalizeGender = (gender) => {
  const genderStr = String(gender || '').toLowerCase();
  if (['m', 'male'].includes(genderStr)) return APP_CONSTANTS.GENDER.MALE;
  if (['f', 'female'].includes(genderStr)) return APP_CONSTANTS.GENDER.FEMALE;
  return APP_CONSTANTS.GENDER.OTHER;
};

/**
 * Check if value is manually provided (not empty, null, or unchanged)
 * @param {*} newVal - New value
 * @param {*} existingVal - Existing value for comparison
 * @returns {boolean}
 */
const isManuallyProvided = (newVal, existingVal) => {
  // If the new value is null, undefined, empty string, or not provided, return false
  if (newVal === null || newVal === undefined || newVal === '') {
    return false;
  }
  
  // If there's no existing value, check if new value is meaningful
  if (existingVal === null || existingVal === undefined || existingVal === '') {
    return newVal !== 0;
  }
  
  // Compare new value with existing value
  // If they're the same, it's not manually changed
  return Number(newVal) !== Number(existingVal);
};

/**
 * Flatten nested object for template replacement
 * @param {Object} obj - Object to flatten
 * @param {string} parent - Parent key
 * @param {Object} res - Result object
 * @returns {Object}
 */
const flattenObject = (obj, parent = '', res = {}) => {
  for (let key in obj) {
    const propName = parent ? `${parent}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};

/**
 * Get month name from month number (1-12)
 * @param {number} monthNumber - Month number (1-12)
 * @param {boolean} abbreviated - Return abbreviated name
 * @returns {string}
 */
const getMonthName = (monthNumber, abbreviated = false) => {
  const months = abbreviated ? APP_CONSTANTS.MONTH_ABBR : APP_CONSTANTS.MONTH_NAMES;
  return months[monthNumber - 1] || '';
};

/**
 * Format date to standard format (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

/**
 * Format date to Indian format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
const formatDateIndian = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB');
};

/**
 * Check if array is valid and not empty
 * @param {*} arr - Array to check
 * @returns {boolean}
 */
const isValidArray = (arr) => {
  return Array.isArray(arr) && arr.length > 0;
};

/**
 * Create a deep copy of an object
 * @param {Object} obj - Object to copy
 * @returns {Object}
 */
const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Sanitize object by removing null/undefined values
 * @param {Object} obj - Object to sanitize
 * @returns {Object}
 */
const sanitizeObject = (obj) => {
  const result = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

/**
 * Round number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number}
 */
const roundNumber = (num, decimals = 2) => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
};

/**
 * Check if value is a valid email
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if value is a valid phone number (10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Generate a random string of specified length
 * @param {number} length - Length of string
 * @returns {string}
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  safe,
  normalizeString,
  normalizeEmpId,
  formatPhoneNumber,
  formatBankAccount,
  normalizeGender,
  isManuallyProvided,
  flattenObject,
  getMonthName,
  formatDate,
  formatDateIndian,
  isValidArray,
  deepCopy,
  sanitizeObject,
  roundNumber,
  isValidEmail,
  isValidPhone,
  generateRandomString,
  delay
};

