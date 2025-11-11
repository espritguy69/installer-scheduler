import { drizzle } from "drizzle-orm/mysql2";
import { orders } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);
const sampleOrders = await db.select().from(orders).limit(5);

console.log("\n=== APPOINTMENT DATE FORMATS ===\n");
sampleOrders.forEach((order, idx) => {
  console.log(`${idx + 1}. Order: ${order.orderNumber}`);
  console.log(`   appointmentDate: "${order.appointmentDate}"`);
  console.log(`   appointmentTime: "${order.appointmentTime}"`);
  console.log(`   Type: ${typeof order.appointmentDate}`);
  console.log('');
});
