function parseTime(appointmentTime) {
  let hours;
  let minutes;
  
  // Try 12-hour format first
  const time12Match = appointmentTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (time12Match) {
    // 12-hour format
    hours = parseInt(time12Match[1]);
    minutes = time12Match[2];
    const period = time12Match[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }
  } else {
    // Try 24-hour format
    const time24Match = appointmentTime.match(/(\d{1,2}):(\d{2})/);
    if (time24Match) {
      hours = parseInt(time24Match[1]);
      minutes = time24Match[2];
      
      // Validate 24-hour format
      if (hours < 0 || hours > 23) {
        return { error: "Invalid time format (hours must be 0-23)" };
      }
    } else {
      return { error: "Invalid time format" };
    }
  }
  
  const scheduledStartTime = `${hours.toString().padStart(2, "0")}:${minutes}`;
  const endHour = (hours + 2) % 24;
  const scheduledEndTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;
  
  return { scheduledStartTime, scheduledEndTime };
}

console.log("\n=== TIME PARSING TESTS ===\n");

const testCases = [
  "10:00 AM",
  "02:30 PM",
  "11:30 AM",
  "06:00 PM",
  "10:00",
  "14:30",
  "23:45",
  "00:15",
  "12:00 PM",
  "12:00 AM",
];

testCases.forEach(time => {
  const result = parseTime(time);
  console.log(`Input: "${time}"`);
  if (result.error) {
    console.log(`  ERROR: ${result.error}`);
  } else {
    console.log(`  Start: ${result.scheduledStartTime}`);
    console.log(`  End:   ${result.scheduledEndTime}`);
  }
  console.log('');
});
