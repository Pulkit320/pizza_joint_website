/**
 * @file        db-init.js
 * @module      DatabaseInitializer
 * @description Cleans and initializes the database schema from the schema dump,
 *              marks migrations V001-V012 as applied, and runs any pending migrations.
 * @layer       script
 * @author      Antigravity
 * @version     1.0.0
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function getDbClient() {
  let config = {};
  if (process.env.DATABASE_URL) {
    config.connectionString = process.env.DATABASE_URL;
    if (process.env.DATABASE_URL.includes('sslmode=require') || 
        process.env.DATABASE_URL.includes('ssl=true') || 
        process.env.NODE_ENV === 'production') {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }
  } else {
    config = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };
  }
  const client = new Client(config);
  await client.connect();
  return client;
}

async function main() {
  console.log('Connecting to database...');
  const client = await getDbClient();
  
  try {
    console.log('Cleaning existing public schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('Public schema cleaned successfully.');

    console.log('Reading schema dump...');
    const dumpPath = path.join(__dirname, '../docs/db/schema_dump.sql');
    if (!fs.existsSync(dumpPath)) {
      throw new Error(`Schema dump file not found at: ${dumpPath}`);
    }
    
    let sqlContent = fs.readFileSync(dumpPath, 'utf8');
    
    // Clean SQL content:
    // 1. Remove psql slash-commands (lines starting with \)
    // 2. Remove OWNER TO statements (which fail on hosted db users like neondb_owner)
    // 3. Remove search_path configurations to prevent connection session search path overrides
    const lines = sqlContent.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('\\')) return false;
      if (trimmed.toUpperCase().includes('OWNER TO')) return false;
      if (trimmed.toLowerCase().includes('set_config(\'search_path\'')) return false;
      return true;
    });
    
    const cleanedSql = cleanedLines.join('\n');
    
    console.log('Executing schema dump SQL...');
    await client.query(cleanedSql);
    console.log('Schema dump executed successfully.');

    console.log('Recording migration markers V001-V012...');
    const migrations = [
      ['V001', 'V001__init_schema_migrations.sql'],
      ['V002', 'V002__alter_orders_add_server.sql'],
      ['V003', 'V003__alter_customers_add_loyalty_fields.sql'],
      ['V004', 'V004__enable_pgcrypto.sql'],
      ['V005', 'V005__create_order_reviews.sql'],
      ['V006', 'V006__create_employee_ratings.sql'],
      ['V007', 'V007__create_loyalty_accounts.sql'],
      ['V008', 'V008__create_loyalty_ledger.sql'],
      ['V009', 'V009__create_referrals.sql'],
      ['V010', 'V010__create_indexes.sql'],
      ['V011', 'V011__create_eotw_selections.sql'],
      ['V012', 'V012__add_updated_at_trigger.sql']
    ];

    for (const [version, filename] of migrations) {
      await client.query(
        'INSERT INTO schema_migrations (version, filename) VALUES ($1, $2);',
        [version, filename]
      );
    }
    console.log('Migration markers recorded.');

  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log('Running pending migrations (V013)...');
  const { migrateUp } = require('./migrate');
  try {
    await migrateUp();
    console.log('Database initialization complete and schema is fully up to date!');
  } catch (error) {
    console.error('Failed to run pending migrations:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
