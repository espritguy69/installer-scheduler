// Test Excel date/time parsing functions

// Helper function to convert Excel date serial number to readable format
function excelDateToReadable(excelDate) {
  if (!excelDate && excelDate !== 0) return "";
  
  // If it's already a string, return it
  if (typeof excelDate === 'string') return excelDate;
  
  // Excel's epoch starts on January 1, 1900
  const excelEpoch = new Date(1900, 0, 1);
  const jsDate = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
  
  // Format as "MMM DD, YYYY" to match Assurance format
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[jsDate.getMonth()]} ${jsDate.getDate()}, ${jsDate.getFullYear()}`;
}

// Helper function to convert Excel time decimal to readable format
function excelTimeToReadable(excelTime) {
  if (!excelTime && excelTime !== 0) return "";
  
  // If it's already a string, return it
  if (typeof excelTime === 'string') return excelTime;
  
  // Convert Excel decimal time to hours and minutes
  const totalMinutes = Math.round(excelTime * 24 * 60);
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for midnight
  
  // Format as HH:MM AM/PM
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Test cases
console.log('\n=== DATE PARSING TESTS ===');
console.log('45962 (Nov 1, 2025):', excelDateToReadable(45962));
console.log('45964 (Nov 3, 2025):', excelDateToReadable(45964));
console.log('45974 (Nov 11, 2025):', excelDateToReadable(45974));

console.log('\n=== TIME PARSING TESTS ===');
console.log('0.4166 (10:00 AM):', excelTimeToReadable(0.4166));
console.log('0.375 (9:00 AM):', excelTimeToReadable(0.375));
console.log('0.5416 (1:00 PM):', excelTimeToReadable(0.5416));
console.log('0.625 (3:00 PM):', excelTimeToReadable(0.625));

console.log('\n=== STRING PASSTHROUGH TESTS ===');
console.log('"Nov 11, 2025":', excelDateToReadable("Nov 11, 2025"));
console.log('"10:00 AM":', excelTimeToReadable("10:00 AM"));
console.log('');
