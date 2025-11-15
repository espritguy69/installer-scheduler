/**
 * Database migration script to normalize all appointment times
 * Removes leading zeros from appointment times (e.g., "02:30 PM" → "2:30 PM")
 * 
 * Run with: node scripts/normalize-appointment-times.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { orders } from '../drizzle/schema.ts';
import { sql } from 'drizzle-orm';

// Normalize time format by removing leading zeros
function normalizeTimeFormat(time) {
  if (!time) return null;
  return time.replace(/^0(\d)/, '$1');
}

async function main() {
  // Connect to database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log('🔍 Scanning database for appointment times with leading zeros...\n');

  // Get all orders with appointment times
  const allOrders = await db.execute(sql`
    SELECT id, orderNumber, appointmentTime 
    FROM orders 
    WHERE appointmentTime IS NOT NULL 
    AND appointmentTime != ''
  `);

  const ordersToUpdate = [];
  const alreadyNormalized = [];

  for (const order of allOrders.rows) {
    const original = order.appointmentTime;
    const normalized = normalizeTimeFormat(original);

    if (original !== normalized) {
      ordersToUpdate.push({
        id: order.id,
        orderNumber: order.orderNumber,
        original,
        normalized
      });
    } else {
      alreadyNormalized.push(order.orderNumber);
    }
  }

  console.log(`📊 Scan Results:`);
  console.log(`   Total orders with appointment times: ${allOrders.rows.length}`);
  console.log(`   Orders needing normalization: ${ordersToUpdate.length}`);
  console.log(`   Orders already normalized: ${alreadyNormalized.length}\n`);

  if (ordersToUpdate.length === 0) {
    console.log('✅ All appointment times are already normalized! No changes needed.\n');
    await connection.end();
    return;
  }

  console.log('📝 Orders to be updated:');
  ordersToUpdate.slice(0, 10).forEach(order => {
    console.log(`   ${order.orderNumber}: "${order.original}" → "${order.normalized}"`);
  });
  if (ordersToUpdate.length > 10) {
    console.log(`   ... and ${ordersToUpdate.length - 10} more\n`);
  } else {
    console.log('');
  }

  // Update each order
  console.log('🔄 Updating appointment times...\n');
  let updated = 0;
  let failed = 0;

  for (const order of ordersToUpdate) {
    try {
      await db.execute(sql`
        UPDATE orders 
        SET appointmentTime = ${order.normalized}
        WHERE id = ${order.id}
      `);
      updated++;
      if (updated % 10 === 0) {
        console.log(`   Updated ${updated}/${ordersToUpdate.length} orders...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to update order ${order.orderNumber}:`, error.message);
      failed++;
    }
  }

  console.log('');
  console.log('✅ Migration complete!');
  console.log(`   Successfully updated: ${updated} orders`);
  if (failed > 0) {
    console.log(`   Failed: ${failed} orders`);
  }
  console.log('');

  await connection.end();
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
