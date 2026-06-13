/**
 * @file        seed.js
 * @module      SeedRunner
 * @description Seeding runner script executing SQL seed files in transaction blocks.
 * @layer       script
 * @author      Antigravity
 * @version     1.0.0
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../backend/src/config/db');

// Check that NODE_ENV is set to development
if (process.env.NODE_ENV !== 'development') {
  console.error("Error: Seed runner can only be executed in 'development' environment.");
  process.exit(1);
}

const freshMode = process.argv.includes('--fresh');

async function main() {
  const client = await pool.connect();
  try {
    if (freshMode) {
      console.log('Clean mode enabled. Truncating all tables...');
      // Reverse dependency order for truncation
      const tables = [
        'eotw_selections',
        'employee_ratings',
        'order_item_ratings',
        'order_reviews',
        'referrals',
        'loyalty_ledger',
        'loyalty_accounts',
        'order_items',
        'orders',
        'deliveries',
        'products',
        'customers',
        'shifts',
        'employees'
      ];
      await client.query(`TRUNCATE TABLE ${tables.map(t => `public.${t}`).join(', ')} CASCADE;`);
      console.log('Tables truncated successfully.');
    }

    // Wrap in a single transaction
    await client.query('BEGIN');

    // Modify/Extend constraints to support all roles and statuses requested
    await client.query('ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;');
    await client.query(`ALTER TABLE public.employees ADD CONSTRAINT employees_role_check CHECK (role IN ('cook', 'driver', 'manager', 'admin', 'server', 'chef', 'delivery_driver', 'cashier'));`);

    await client.query('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;');
    await client.query(`ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'processing', 'delivered', 'collected', 'cancelled', 'in_kitchen', 'out_for_delivery'));`);

    const seedsDir = path.join(__dirname, 'seeds');
    
    // Ensure seeds directory exists
    if (!fs.existsSync(seedsDir)) {
      fs.mkdirSync(seedsDir, { recursive: true });
    }

    const files = fs.readdirSync(seedsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Alphabetic order

    let totalRowsInserted = 0;
    const seededTables = new Set();

    for (const file of files) {
      console.log(`Seeding: ${file}...`);
      const filePath = path.join(seedsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Execute SQL content
      const res = await client.query(sqlContent);

      // Extract table names inserted into
      const regex = /insert\s+into\s+(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)/gi;
      let match;
      while ((match = regex.exec(sqlContent)) !== null) {
        seededTables.add(match[1].toLowerCase());
      }

      // Count rows inserted
      if (Array.isArray(res)) {
        for (const r of res) {
          if (r.command === 'INSERT') {
            totalRowsInserted += r.rowCount || 0;
          }
        }
      } else {
        if (res.command === 'INSERT') {
          totalRowsInserted += res.rowCount || 0;
        }
      }
    }

    await client.query('COMMIT');
    console.log(`Seed complete. ${totalRowsInserted} rows inserted across ${seededTables.size} tables.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding transaction failed. Rolled back.', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
