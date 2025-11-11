// Test date parsing
const appointmentDate = "Nov 1, 2025";
const scheduledDate = new Date(appointmentDate);
console.log("\n=== DATE PARSING TEST ===");
console.log(`Input: "${appointmentDate}"`);
console.log(`Output: ${scheduledDate}`);
console.log(`ISO: ${scheduledDate.toISOString()}`);

// Test time parsing
const appointmentTime = "10:00 AM";
const timeMatch = appointmentTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
console.log("\n=== TIME PARSING TEST ===");
console.log(`Input: "${appointmentTime}"`);
console.log(`Match: ${JSON.stringify(timeMatch)}`);

if (timeMatch) {
  let hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2];
  const period = timeMatch[3].toUpperCase();
  
  console.log(`Parsed: ${hours}:${minutes} ${period}`);
  
  // Convert to 24-hour format
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }
  
  const scheduledStartTime = `${hours.toString().padStart(2, "0")}:${minutes}`;
  const endHour = (hours + 2) % 24;
  const scheduledEndTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;
  
  console.log(`Start Time (24h): ${scheduledStartTime}`);
  console.log(`End Time (24h): ${scheduledEndTime}`);
}

// Test with PM time
const appointmentTime2 = "02:30 PM";
const timeMatch2 = appointmentTime2.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
console.log("\n=== TIME PARSING TEST 2 ===");
console.log(`Input: "${appointmentTime2}"`);

if (timeMatch2) {
  let hours = parseInt(timeMatch2[1]);
  const minutes = timeMatch2[2];
  const period = timeMatch2[3].toUpperCase();
  
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }
  
  const scheduledStartTime = `${hours.toString().padStart(2, "0")}:${minutes}`;
  const endHour = (hours + 2) % 24;
  const scheduledEndTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;
  
  console.log(`Start Time (24h): ${scheduledStartTime}`);
  console.log(`End Time (24h): ${scheduledEndTime}`);
}

console.log("\n");
