/**
 * Convert number to words (Indian numbering system)
 * @param {number} num - Number to convert
 * @returns {string} - Number in words
 */
const numberToWords = (num) => {
  if (isNaN(num)) return '';
  
  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);
  
  let words = (num < 0 ? 'Negative ' : '') + convertToWords(integerPart);
  
  if (decimalPart > 0) {
    words += ' and ' + convertToWords(decimalPart) + ' Paise';
  }
  
  return words.trim();
};

/**
 * Convert number to words helper
 * @param {number} num - Number to convert
 * @returns {string}
 */
const convertToWords = (num) => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
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
  
  // Crores (10,000,000)
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  
  // Lakhs (100,000)
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  // Thousands (1,000)
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  // Remaining (0-999)
  if (num > 0) {
    result += convertHundreds(num);
  }

  return result.trim();
};

/**
 * Format number as Indian currency (₹1,23,456.78)
 * @param {number} num - Number to format
 * @param {boolean} includeSymbol - Include rupee symbol
 * @returns {string}
 */
const formatIndianCurrency = (num, includeSymbol = true) => {
  if (isNaN(num)) return includeSymbol ? '₹0.00' : '0.00';
  
  const formattedNum = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return includeSymbol ? `₹${formattedNum}` : formattedNum;
};

/**
 * Format number as Indian numbering (1,23,456)
 * @param {number} num - Number to format
 * @returns {string}
 */
const formatIndianNumber = (num) => {
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
};

/**
 * Round to 2 decimal places
 * @param {number} num - Number to round
 * @returns {number}
 */
const roundToTwo = (num) => {
  return Math.round(num * 100) / 100;
};

/**
 * Round to nearest integer
 * @param {number} num - Number to round
 * @returns {number}
 */
const roundToNearest = (num) => {
  return Math.round(num);
};

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @param {number} decimals - Decimal places
 * @returns {number}
 */
const calculatePercentage = (value, total, decimals = 2) => {
  if (total === 0) return 0;
  const percentage = (value / total) * 100;
  return Number(percentage.toFixed(decimals));
};

/**
 * Calculate percentage of a number
 * @param {number} number - Base number
 * @param {number} percentage - Percentage
 * @returns {number}
 */
const percentageOf = (number, percentage) => {
  return (number * percentage) / 100;
};

/**
 * Clamp number between min and max
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number}
 */
const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
};

/**
 * Check if number is in range
 * @param {number} num - Number to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean}
 */
const isInRange = (num, min, max) => {
  return num >= min && num <= max;
};

module.exports = {
  numberToWords,
  convertToWords,
  formatIndianCurrency,
  formatIndianNumber,
  roundToTwo,
  roundToNearest,
  calculatePercentage,
  percentageOf,
  clamp,
  isInRange
};

