// Test different Excel date formulas

function method1(excelDate) {
  // Current method: Dec 30, 1899 epoch
  const excelEpoch = new Date(1899, 11, 30);
  const jsDate = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[jsDate.getMonth()]} ${jsDate.getDate()}, ${jsDate.getFullYear()}`;
}

function method2(excelDate) {
  // Corrected: Jan 1, 1900 epoch minus 2 days
  const excelEpoch = new Date(1900, 0, 1);
  const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[jsDate.getMonth()]} ${jsDate.getDate()}, ${jsDate.getFullYear()}`;
}

function method3(excelDate) {
  // Alternative: Dec 31, 1899 epoch
  const excelEpoch = new Date(1899, 11, 31);
  const jsDate = new Date(excelEpoch.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[jsDate.getMonth()]} ${jsDate.getDate()}, ${jsDate.getFullYear()}`;
}

console.log('\nTesting Excel serial 45962 (should be Nov 1, 2025):');
console.log('Method 1 (current):', method1(45962));
console.log('Method 2 (minus 2):', method2(45962));
console.log('Method 3 (Dec 31):', method3(45962));

console.log('\nTesting Excel serial 45974 (should be Nov 11, 2025):');
console.log('Method 1 (current):', method1(45974));
console.log('Method 2 (minus 2):', method2(45974));
console.log('Method 3 (Dec 31):', method3(45974));
console.log('');
