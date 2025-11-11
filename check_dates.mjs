import { drizzle } from "drizzle-orm/mysql2";
import { orders } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);
const allOrders = await db.select({
  orderNumber: orders.orderNumber,
  customerName: orders.customerName,
  appointmentDate: orders.appointmentDate,
  appointmentTime: orders.appointmentTime
}).from(orders).where(orders.orderNumber.like('AWO%'));

console.log('Total orders:', allOrders.length);
console.log('\nOrder details:');
allOrders.forEach(order => {
  console.log(`${order.orderNumber}: date="${order.appointmentDate}" time="${order.appointmentTime}"`);
});
