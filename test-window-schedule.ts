/**
 * Test script to verify window close scheduling logic
 * Tests that the scheduler correctly calculates next 11:50 AM/PM EST times
 */

// Helper function to get current time in EST/EDT
function getEasternTime(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(new Date());
  const dateObj: any = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateObj[part.type] = part.value;
    }
  });
  
  return new Date(
    `${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`
  );
}

// Test function to calculate next window close time
function calculateNextWindowClose(testTime?: Date): { nextTime: Date; minutesUntil: number } {
  const estNow = testTime || getEasternTime();
  
  const hour = estNow.getHours();
  const minute = estNow.getMinutes();
  
  console.log(`\nCurrent EST time: ${estNow.toLocaleString('en-US', { hour12: true })} (${hour}:${minute.toString().padStart(2, '0')})`);
  
  // Calculate next 11:50 AM or 11:50 PM in EST
  let nextRunHour: number;
  if (hour < 11 || (hour === 11 && minute < 50)) {
    // Next run is today at 11:50 AM
    nextRunHour = 11;
    console.log('Next window: Today at 11:50 AM');
  } else if (hour < 23 || (hour === 23 && minute < 50)) {
    // Next run is today at 11:50 PM
    nextRunHour = 23;
    console.log('Next window: Today at 11:50 PM');
  } else {
    // Next run is tomorrow at 11:50 AM
    nextRunHour = 11 + 24; // Will handle day rollover below
    console.log('Next window: Tomorrow at 11:50 AM');
  }
  
  // Create target time in EST
  const targetEST = new Date(estNow);
  if (nextRunHour >= 24) {
    targetEST.setDate(targetEST.getDate() + 1);
    targetEST.setHours(11, 50, 0, 0);
  } else {
    targetEST.setHours(nextRunHour, 50, 0, 0);
  }
  
  // Calculate milliseconds until next run
  const msUntilNext = targetEST.getTime() - estNow.getTime();
  const minutesUntilNext = Math.round(msUntilNext / 1000 / 60);
  
  console.log(`Target time: ${targetEST.toLocaleString('en-US', { hour12: true })}`);
  console.log(`Minutes until next window: ${minutesUntilNext}`);
  
  return { nextTime: targetEST, minutesUntil: minutesUntilNext };
}

// Test cases
console.log('=== Window Close Scheduling Test ===\n');

// Test 1: Current time
console.log('TEST 1: Current actual time');
calculateNextWindowClose();

// Test 2: Early morning (should schedule for 11:50 AM same day)
console.log('\n\nTEST 2: Early morning (3:00 AM)');
const test2 = new Date('2025-12-15T03:00:00');
calculateNextWindowClose(test2);

// Test 3: Just before 11:50 AM (should schedule for 11:50 AM same day)
console.log('\n\nTEST 3: Just before 11:50 AM (11:45 AM)');
const test3 = new Date('2025-12-15T11:45:00');
calculateNextWindowClose(test3);

// Test 4: Just after 11:50 AM (should schedule for 11:50 PM same day)
console.log('\n\nTEST 4: Just after 11:50 AM (11:55 AM)');
const test4 = new Date('2025-12-15T11:55:00');
calculateNextWindowClose(test4);

// Test 5: Afternoon (should schedule for 11:50 PM same day)
console.log('\n\nTEST 5: Afternoon (3:00 PM)');
const test5 = new Date('2025-12-15T15:00:00');
calculateNextWindowClose(test5);

// Test 6: Just before 11:50 PM (should schedule for 11:50 PM same day)
console.log('\n\nTEST 6: Just before 11:50 PM (11:45 PM)');
const test6 = new Date('2025-12-15T23:45:00');
calculateNextWindowClose(test6);

// Test 7: Just after 11:50 PM (should schedule for 11:50 AM next day)
console.log('\n\nTEST 7: Just after 11:50 PM (11:55 PM)');
const test7 = new Date('2025-12-15T23:55:00');
calculateNextWindowClose(test7);

console.log('\n\n=== All tests completed ===');
