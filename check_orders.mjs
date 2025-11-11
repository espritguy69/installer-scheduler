import { drizzle } from "drizzle-orm/mysql2";
import { orders } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);
const allOrders = await db.select().from(orders).limit(20);

console.log("\n=== ORDERS IN DATABASE ===\n");
allOrders.forEach((order, idx) => {
  console.log(`${idx + 1}. Order: ${order.orderNumber}`);
  console.log(`   Service No: ${order.serviceNumber || 'N/A'}`);
  console.log(`   Customer: ${order.customerName}`);
  console.log(`   App Date: "${order.appointmentDate}"`);
  console.log(`   App Time: "${order.appointmentTime}"`);
  console.log(`   Building: ${order.buildingName || 'N/A'}`);
  console.log(`   Created: ${order.createdAt}`);
  console.log('');
});

console.log(`Total orders: ${allOrders.length}\n`);
