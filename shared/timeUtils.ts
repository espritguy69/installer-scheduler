/**
 * Shared utility functions for time format handling
 * Ensures consistent time format across the entire application
 */

/**
 * Normalizes time format by removing leading zeros
 * Examples:
 * - "02:30 PM" → "2:30 PM"
 * - "2:30 PM" → "2:30 PM"
 * - "10:00 AM" → "10:00 AM"
 * - "09:00 AM" → "9:00 AM"
 * 
 * @param time - Time string in 12-hour format (e.g., "02:30 PM", "9:00 AM")
 * @returns Normalized time string without leading zeros
 */
export function normalizeTimeFormat(time: string | null | undefined): string | null {
  if (!time) return null;
  
  // Remove leading zero from hour (e.g., "02:30 PM" → "2:30 PM")
  return time.replace(/^0(\d)/, '$1');
}

/**
 * Converts Excel decimal time format to readable 12-hour format
 * Excel stores times as decimal fractions of a day
 * Examples:
 * - 0.375 → "9:00 AM" (0.375 * 24 = 9 hours)
 * - 0.5 → "12:00 PM" (0.5 * 24 = 12 hours)
 * - 0.604166667 → "2:30 PM" (0.604166667 * 24 = 14.5 hours)
 * 
 * @param excelTime - Excel decimal time value or already formatted string
 * @returns Normalized time string in 12-hour format without leading zeros
 */
export function excelTimeToReadable(excelTime: string | number | null | undefined): string | null {
  if (excelTime === null || excelTime === undefined || excelTime === '') return null;
  
  // If already a string (not a decimal), normalize and return
  if (typeof excelTime === 'string') {
    return normalizeTimeFormat(excelTime);
  }
  
  // Convert Excel decimal to hours and minutes
  const totalHours = excelTime * 24;
  let hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  
  // Handle edge case where rounding pushes minutes to 60
  if (minutes === 60) {
    hours += 1;
    return formatTime12Hour(hours, 0);
  }
  
  return formatTime12Hour(hours, minutes);
}

/**
 * Formats hours and minutes to 12-hour format without leading zeros
 * @param hours - Hour in 24-hour format (0-23)
 * @param minutes - Minutes (0-59)
 * @returns Formatted time string (e.g., "2:30 PM", "9:00 AM")
 */
function formatTime12Hour(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  const minuteStr = minutes.toString().padStart(2, '0');
  
  // No leading zero for hour (e.g., "2:30 PM" not "02:30 PM")
  return `${hour12}:${minuteStr} ${period}`;
}

/**
 * Validates if a time string is in correct 12-hour format
 * @param time - Time string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimeFormat(time: string | null | undefined): boolean {
  if (!time) return false;
  
  // Match 12-hour format with optional leading zero: "2:30 PM", "02:30 PM", "10:00 AM"
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
  return timeRegex.test(time);
}
