/**
 * Convert time string to minutes
 * @param {string} timeStr - Time string (HH:MM or HH:MM:SS)
 * @returns {number} - Total minutes
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '00:00' || timeStr === '00:00:00') return 0;
  
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseInt(parts[2]) || 0;
  
  return hours * 60 + minutes + Math.round(seconds / 60);
};

/**
 * Convert minutes to time string
 * @param {number} totalMinutes - Total minutes
 * @param {boolean} includeSeconds - Include seconds in output
 * @returns {string} - Time string (HH:MM or HH:MM:SS)
 */
const minutesToTime = (totalMinutes, includeSeconds = false) => {
  if (totalMinutes <= 0) {
    return includeSeconds ? '00:00:00' : '00:00';
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.round((totalMinutes % 1) * 60);
  
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return includeSeconds ? `${timeStr}:${seconds.toString().padStart(2, '0')}` : timeStr;
};

/**
 * Normalize time string to HH:MM:SS format
 * @param {*} timeStr - Time value to normalize
 * @returns {string}
 */
const normalizeTime = (timeStr) => {
  if (!timeStr || timeStr === '') return '00:00:00';
  
  // Convert number to time if needed (Excel decimal time format)
  if (typeof timeStr === 'number') {
    if (timeStr > 0 && timeStr < 1) {
      const totalMinutes = Math.round(timeStr * 24 * 60);
      return minutesToTime(totalMinutes, true);
    }
    return timeStr.toString();
  }
  
  const str = timeStr.toString().trim();
  
  // Already in correct format
  if (str === '00:00' || str === '0:00') return '00:00:00';
  
  // Add seconds if missing
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length === 2) return `${str}:00`;
    if (parts.length === 3) return str;
  }
  
  return '00:00:00';
};

/**
 * Parse time string to get hours and minutes
 * @param {string} timeStr - Time string
 * @returns {Object|null} - { hours, minutes, totalMinutes }
 */
const parseTime = (timeStr) => {
  if (!timeStr || timeStr === '00:00:00' || timeStr === '00:00') return null;
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const totalMinutes = hours * 60 + minutes;
  
  return { hours, minutes, totalMinutes };
};

/**
 * Add two time strings
 * @param {string} time1 - First time string
 * @param {string} time2 - Second time string
 * @returns {string} - Sum of times
 */
const addTimes = (time1, time2) => {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  return minutesToTime(minutes1 + minutes2, true);
};

/**
 * Subtract two time strings
 * @param {string} time1 - First time string
 * @param {string} time2 - Second time string
 * @returns {string} - Difference of times
 */
const subtractTimes = (time1, time2) => {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  const diff = Math.max(0, minutes1 - minutes2);
  return minutesToTime(diff, true);
};

/**
 * Calculate duration between in-time and out-time
 * @param {string} inTime - In time (HH:MM:SS)
 * @param {string} outTime - Out time (HH:MM:SS)
 * @returns {string} - Duration
 */
const calculateDuration = (inTime, outTime) => {
  const inMinutes = timeToMinutes(inTime);
  const outMinutes = timeToMinutes(outTime);
  
  if (inMinutes === 0 || outMinutes === 0) return '00:00:00';
  
  let duration = outMinutes - inMinutes;
  
  // Handle overnight shift
  if (duration < 0) {
    duration += 24 * 60; // Add 24 hours
  }
  
  return minutesToTime(duration, true);
};

/**
 * Check if time is late (after specified cutoff)
 * @param {string} timeStr - Time to check
 * @param {string} cutoffTime - Cutoff time
 * @returns {boolean}
 */
const isLate = (timeStr, cutoffTime = '09:15:00') => {
  const minutes = timeToMinutes(timeStr);
  const cutoffMinutes = timeToMinutes(cutoffTime);
  return minutes > cutoffMinutes;
};

/**
 * Calculate late time
 * @param {string} inTime - Actual in time
 * @param {string} expectedTime - Expected in time
 * @returns {string} - Late duration
 */
const calculateLateTime = (inTime, expectedTime = '09:00:00') => {
  const inMinutes = timeToMinutes(inTime);
  const expectedMinutes = timeToMinutes(expectedTime);
  
  if (inMinutes <= expectedMinutes) return '00:00:00';
  
  const lateMinutes = inMinutes - expectedMinutes;
  return minutesToTime(lateMinutes, true);
};

/**
 * Calculate early exit time
 * @param {string} outTime - Actual out time
 * @param {string} expectedTime - Expected out time
 * @returns {string} - Early duration
 */
const calculateEarlyTime = (outTime, expectedTime = '18:00:00') => {
  const outMinutes = timeToMinutes(outTime);
  const expectedMinutes = timeToMinutes(expectedTime);
  
  if (outMinutes >= expectedMinutes) return '00:00:00';
  
  const earlyMinutes = expectedMinutes - outMinutes;
  return minutesToTime(earlyMinutes, true);
};

/**
 * Calculate overtime
 * @param {string} duration - Total duration worked
 * @param {string} standardHours - Standard working hours
 * @returns {string} - Overtime duration
 */
const calculateOvertime = (duration, standardHours = '09:00:00') => {
  const durationMinutes = timeToMinutes(duration);
  const standardMinutes = timeToMinutes(standardHours);
  
  if (durationMinutes <= standardMinutes) return '00:00:00';
  
  const otMinutes = durationMinutes - standardMinutes;
  return minutesToTime(otMinutes, true);
};

/**
 * Format time for display (remove leading zeros)
 * @param {string} timeStr - Time string
 * @returns {string}
 */
const formatTimeDisplay = (timeStr) => {
  if (!timeStr) return '00:00';
  
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0]) || 0;
  const minutes = parts[1] || '00';
  
  return `${hours}:${minutes}`;
};

/**
 * Check if time string is valid
 * @param {string} timeStr - Time string to validate
 * @returns {boolean}
 */
const isValidTime = (timeStr) => {
  if (!timeStr) return false;
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(timeStr);
};

module.exports = {
  timeToMinutes,
  minutesToTime,
  normalizeTime,
  parseTime,
  addTimes,
  subtractTimes,
  calculateDuration,
  isLate,
  calculateLateTime,
  calculateEarlyTime,
  calculateOvertime,
  formatTimeDisplay,
  isValidTime
};

