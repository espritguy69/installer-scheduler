import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const result = await connection.query(
  'SELECT orderNumber, appointmentDate, appointmentTime FROM orders LIMIT 10'
);

console.log('First 10 orders appointment dates:');
console.log(JSON.stringify(result[0], null, 2));

await connection.end();
