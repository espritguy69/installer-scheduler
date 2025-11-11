import { drizzle } from "drizzle-orm/mysql2";
import { orders } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);
const allOrders = await db.select().from(orders).limit(30);

console.log("\n=== ORDERS WITH TIMES ===\n");
allOrders.forEach((order, idx) => {
  console.log(`${idx + 1}. ${order.orderNumber}`);
  console.log(`   Time: "${order.appointmentTime}"`);
  console.log(`   Date: "${order.appointmentDate}"`);
  console.log('');
});

// Group by time
const byTime = {};
allOrders.forEach(o => {
  const time = o.appointmentTime || 'NO TIME';
  if (!byTime[time]) byTime[time] = [];
  byTime[time].push(o.orderNumber);
});

console.log('\n=== GROUPED BY TIME ===\n');
Object.keys(byTime).sort().forEach(time => {
  console.log(`${time}: ${byTime[time].length} orders`);
  console.log(`  ${byTime[time].join(', ')}`);
});
console.log('');
