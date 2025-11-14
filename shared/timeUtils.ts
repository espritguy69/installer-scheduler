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

/**
 * Parses appointment date string in various formats to Date object
 * Handles:
 * - YYYY-MM-DD format (e.g., "2025-11-13") - ISO standard from HTML date inputs
 * - DD/MM/YYYY format (e.g., "13/11/2025") - International standard
 * - MM/DD/YYYY format (e.g., "11/13/2025") - American format
 * - "Nov 13, 2025" format - Text format
 * 
 * @param dateStr - Date string in various formats
 * @returns Date object or null if parsing fails
 */
export function parseAppointmentDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  // Handle ISO format (YYYY-MM-DD) from HTML date inputs
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr + 'T00:00:00');
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Handle slash-separated dates (DD/MM/YYYY or MM/DD/YYYY)
  if (dateStr.includes("/")) {
    const dateParts = dateStr.split("/");
    if (dateParts.length !== 3) return null;
    
    const part1 = parseInt(dateParts[0], 10);
    const part2 = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    
    // If first part > 12, it must be DD/MM/YYYY format
    // If second part > 12, it must be MM/DD/YYYY format
    let month: number, day: number;
    if (part1 > 12) {
      // DD/MM/YYYY format
      day = part1;
      month = part2;
    } else if (part2 > 12) {
      // MM/DD/YYYY format
      month = part1;
      day = part2;
    } else {
      // Ambiguous - assume DD/MM/YYYY (international standard)
      day = part1;
      month = part2;
    }
    
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Handle text format like "Nov 13, 2025"
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Detects the date format of a given date string
 * @param dateStr - Date string to analyze
 * @returns Detected format: 'ISO' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'TEXT' | 'UNKNOWN'
 */
export function detectDateFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return 'UNKNOWN';
  
  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'ISO';
  
  // Slash-separated: DD/MM/YYYY or MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    
    if (first > 12) return 'DD/MM/YYYY';
    if (second > 12) return 'MM/DD/YYYY';
    // Ambiguous - default to DD/MM/YYYY (international)
    return 'DD/MM/YYYY';
  }
  
  // Text format: "Nov 13, 2025" or similar
  if (/[a-zA-Z]/.test(dateStr)) return 'TEXT';
  
  return 'UNKNOWN';
}

/**
 * Converts any date format to DD/MM/YYYY format (international standard)
 * This is the preferred storage format for the database
 * @param dateStr - Date string in any supported format
 * @returns Date in DD/MM/YYYY format or null if parsing fails
 */
export function toStandardDateFormat(dateStr: string | null | undefined): string | null {
  const date = parseAppointmentDate(dateStr);
  if (!date) return null;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Converts any date format to ISO format (YYYY-MM-DD)
 * This is the preferred format for HTML date inputs and backend processing
 * @param dateStr - Date string in any supported format
 * @returns Date in YYYY-MM-DD format or null if parsing fails
 */
export function toISODateFormat(dateStr: string | null | undefined): string | null {
  const date = parseAppointmentDate(dateStr);
  if (!date) return null;
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converts any date format to a human-readable display format
 * @param dateStr - Date string in any supported format
 * @param format - Display format: 'short' | 'medium' | 'long'
 * @returns Formatted date string or null if parsing fails
 */
export function toDisplayDateFormat(
  dateStr: string | null | undefined,
  format: 'short' | 'medium' | 'long' = 'medium'
): string | null {
  const date = parseAppointmentDate(dateStr);
  if (!date) return null;
  
  switch (format) {
    case 'short':
      // "13/11/2025"
      return toStandardDateFormat(dateStr);
    case 'medium':
      // "Nov 13, 2025"
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    case 'long':
      // "November 13, 2025"
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    default:
      return toStandardDateFormat(dateStr);
  }
}

/**
 * Validates and normalizes a date string to ensure consistency
 * Converts any valid date format to DD/MM/YYYY format
 * @param dateStr - Date string to normalize
 * @returns Normalized date string in DD/MM/YYYY format or null if invalid
 */
export function normalizeDateString(dateStr: string | null | undefined): string | null {
  return toStandardDateFormat(dateStr);
}

/**
 * Converts 24-hour time format to 12-hour format
 * @param time24 - Time in 24-hour format (e.g., "14:30", "09:00")
 * @returns Time in 12-hour format (e.g., "2:30 PM", "9:00 AM")
 */
export function convert24To12Hour(time24: string | null | undefined): string | null {
  if (!time24) return null;
  
  const match = time24.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = match[2];
  
  return formatTime12Hour(hours, parseInt(minutes, 10));
}

/**
 * Converts 12-hour time format to 24-hour format
 * @param time12 - Time in 12-hour format (e.g., "2:30 PM", "9:00 AM")
 * @returns Time in 24-hour format (e.g., "14:30", "09:00")
 */
export function convert12To24Hour(time12: string | null | undefined): string | null {
  if (!time12) return null;
  
  const match = time12.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Generate time slots in 30-minute intervals
 * @param startHour - Starting hour (default: 8 for 8:00 AM)
 * @param endHour - Ending hour (default: 18 for 6:00 PM)
 * @returns Array of time strings in HH:MM format (24-hour)
 */
export function generateTimeSlots(startHour: number = 8, endHour: number = 18): string[] {
  const slots: string[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    // Add :00 slot
    const hourStr = hour.toString().padStart(2, '0');
    slots.push(`${hourStr}:00`);
    
    // Add :30 slot (except for the last hour)
    if (hour < endHour) {
      slots.push(`${hourStr}:30`);
    }
  }
  
  return slots;
}

/**
 * Format time slot for display (e.g., "09:00" -> "9:00 AM")
 * @param time - Time string in HH:MM format (24-hour)
 * @returns Formatted time string in 12-hour format
 */
export function formatTimeSlot(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minute} ${period}`;
}
