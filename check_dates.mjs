import { drizzle } from 'drizzle-orm/mysql2';
import { orders } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);
const allOrders = await db.select().from(orders).limit(5);

console.log('First 5 orders appointment dates:');
allOrders.forEach(order => {
  console.log(`Order ${order.orderNumber}: appointmentDate="${order.appointmentDate}", appointmentTime="${order.appointmentTime}"`);
});
