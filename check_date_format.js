const mysql = require('mysql2/promise');

async function checkDates() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute('SELECT orderNumber, appointmentDate, appointmentTime FROM orders LIMIT 3');
  console.log('Sample orders:');
  rows.forEach(row => {
    console.log(`  ${row.orderNumber}: date="${row.appointmentDate}" time="${row.appointmentTime}"`);
  });
  await connection.end();
}

checkDates().catch(console.error);
