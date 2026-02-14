/* =========================
   TIME UTILS (FINAL – SAFE)
   🔥 NO ROUNDING
   🔥 SECONDS PRESERVED
   🔥 24-HOUR FORMAT ONLY
========================= */

/**
 * Convert HH:MM[:SS] → total SECONDS
 * Returns null ONLY if time is missing / invalid
 */
const timeToSeconds = (value) => {
  if (value === null || value === undefined) return null;

  const str = String(value).trim();
  if (str === '' || str === '00:00' || str === '00:00:00') return null;

  const parts = str.split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(n => isNaN(n))) {
    return null;
  }

  const [h = 0, m = 0, s = 0] = parts;

  // 🔒 Strict bounds check
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) {
    return null;
  }

  return h * 3600 + m * 60 + s;
};

/**
 * Convert SECONDS → HH:MM:SS
 */
const secondsToTime = (totalSeconds) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '00:00:00';
  }

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(
    2,
    '0'
  )}:${String(s).padStart(2, '0')}`;
};

/**
 * Convert HH:MM[:SS] → total MINUTES (floor-safe)
 */
const timeToMinutes = (value) => {
  const seconds = timeToSeconds(value);
  if (seconds === null) return 0;
  return Math.floor(seconds / 60);
};

/**
 * Convert total MINUTES → HH:MM
 */
const minutesToTime = (totalMinutes) => {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '00:00';
  }

  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Normalize ANY excel / string time → HH:MM:SS
 * ✅ preserves seconds
 * ✅ no rounding
 * ✅ supports Excel numeric time
 * ✅ rejects garbage safely
 */
const normalizeTime = (value) => {
  if (value === null || value === undefined || value === '') {
    return '00:00:00';
  }

  /* ---------- Excel numeric time ---------- */
  // Example: 0.386145 → 09:16:03
  if (typeof value === 'number' && value > 0 && value < 1) {
    const totalSeconds = Math.floor(value * 24 * 60 * 60);
    return secondsToTime(totalSeconds);
  }

  const str = String(value).trim();

  /* ---------- HH:MM:SS ---------- */
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(str)) {
    const [h, m, s] = str.split(':').map(Number);
    if (
      h >= 0 && h <= 23 &&
      m >= 0 && m <= 59 &&
      s >= 0 && s <= 59
    ) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(
        2,
        '0'
      )}:${String(s).padStart(2, '0')}`;
    }
    return '00:00:00';
  }

  /* ---------- HH:MM ---------- */
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':').map(Number);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(
        2,
        '0'
      )}:00`;
    }
    return '00:00:00';
  }

  /* ---------- INVALID ---------- */
  return '00:00:00';
};

module.exports = {
  // seconds helpers
  timeToSeconds,
  secondsToTime,

  // minutes helpers (USED by payroll summary)
  timeToMinutes,
  minutesToTime,

  // normalize
  normalizeTime,
};
