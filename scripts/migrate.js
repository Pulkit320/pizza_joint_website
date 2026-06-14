/**
 * @file        migrate.js
 * @module      MigrationRunner
 * @description Command-line database migration utility for PostgreSQL.
 * @layer       util
 * @author      Architect Agent
 * @version     1.0.0
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const MIGRATIONS_DIR = path.join(__dirname, '../backend/migrations');

/**
 * @function  getDbClient
 * @summary   Creates and connects a PostgreSQL client using environment configurations
 * @returns   {Promise<object>} The connected Client instance
 * @throws    {Error} When connection fails
 */
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

/**
 * @function  schemaMigrationsTableExists
 * @summary   Checks if the schema_migrations tracking table exists in the database
 * @param     {object}           client - The active database client
 * @returns   {Promise<boolean>} True if the table exists, false otherwise
 * @throws    {Error} If the database query fails
 */
async function schemaMigrationsTableExists(client) {
  const sql = `
    SELECT EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename  = 'schema_migrations'
    );
  `;
  const res = await client.query(sql);
  return res.rows[0].exists;
}

/**
 * @function  getAppliedMigrations
 * @summary   Retrieves the list of applied migrations from the tracking table
 * @param     {object}          client - The active database client
 * @returns   {Promise<Array>}  List of applied migration records
 * @throws    {Error} If retrieval fails
 */
async function getAppliedMigrations(client) {
  const exists = await schemaMigrationsTableExists(client);
  if (!exists) {
    return [];
  }
  const sql = 'SELECT version, filename, applied_at FROM schema_migrations ORDER BY version ASC;';
  const res = await client.query(sql);
  return res.rows;
}

/**
 * @function  getLocalMigrations
 * @summary   Scans the migrations directory for files matching the version format
 * @returns   {Array} Sorted list of migration file details
 * @throws    {Error} If reading the directory fails
 */
function getLocalMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR);
  const migrations = [];

  for (const file of files) {
    // Match only migration files (e.g. V001__init.sql), ignore down files
    const match = file.match(/^(V[0-9]+)__(.+)(?<!\.down)\.sql$/);
    if (match) {
      migrations.push({
        version: match[1],
        description: match[2].replace(/_/g, ' '),
        filename: file,
        filePath: path.join(MIGRATIONS_DIR, file),
      });
    }
  }

  // Sort chronologically/alphabetically
  return migrations.sort((a, b) => a.version.localeCompare(b.version));
}

/**
 * @function  migrateUp
 * @summary   Executes all pending migrations in alphabetical order
 * @returns   {Promise<void>}
 * @throws    {Error} If any migration execution fails
 */
async function migrateUp() {
  const client = await getDbClient();
  try {
    const localMigrations = getLocalMigrations();
    const appliedMigrations = await getAppliedMigrations(client);
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));

    const pending = localMigrations.filter(m => !appliedVersions.has(m.version));

    if (pending.length === 0) {
      console.log('Schema is up to date. No pending migrations.');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s). Running migrations...`);

    for (const migration of pending) {
      console.log(`Applying: ${migration.filename}...`);
      const sqlContent = fs.readFileSync(migration.filePath, 'utf8');

      // Execute migration in a transaction
      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        // Insert record (V001 creates the schema_migrations table inside this transaction)
        const insertSql = 'INSERT INTO schema_migrations (version, filename) VALUES ($1, $2);';
        await client.query(insertSql, [migration.version, migration.filename]);
        await client.query('COMMIT');
        console.log(`Successfully applied: ${migration.filename}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to apply: ${migration.filename}`);
        throw err;
      }
    }
  } finally {
    await client.end();
  }
}

/**
 * @function  migrateDown
 * @summary   Rolls back the single most recently applied migration
 * @returns   {Promise<void>}
 * @throws    {Error} If rollback execution fails or if no rollback file is found
 */
async function migrateDown() {
  const client = await getDbClient();
  try {
    const appliedMigrations = await getAppliedMigrations(client);
    if (appliedMigrations.length === 0) {
      console.log('No applied migrations found. Nothing to roll back.');
      return;
    }

    // Last applied is the one with the highest version
    const lastApplied = appliedMigrations[appliedMigrations.length - 1];
    const downFilename = lastApplied.filename.replace(/\.sql$/, '.down.sql');
    const downFilePath = path.join(MIGRATIONS_DIR, downFilename);

    if (!fs.existsSync(downFilePath)) {
      throw new Error(`Rollback file not found: ${downFilename}`);
    }

    console.log(`Rolling back migration: ${lastApplied.filename} using ${downFilename}...`);
    const sqlContent = fs.readFileSync(downFilePath, 'utf8');

    await client.query('BEGIN');
    try {
      await client.query(sqlContent);

      // If the migrations table still exists, delete the record.
      // (Rolling back V001 drops schema_migrations table itself).
      const tableStillExists = await schemaMigrationsTableExists(client);
      if (tableStillExists) {
        await client.query('DELETE FROM schema_migrations WHERE version = $1;', [lastApplied.version]);
      }

      await client.query('COMMIT');
      console.log(`Successfully rolled back: ${lastApplied.filename}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Failed to roll back: ${lastApplied.filename}`);
      throw err;
    }
  } finally {
    await client.end();
  }
}

/**
 * @function  displayStatus
 * @summary   Lists all local migrations, showing applied date or pending status
 * @returns   {Promise<void>}
 * @throws    {Error} If status retrieval fails
 */
async function displayStatus() {
  const client = await getDbClient();
  try {
    const localMigrations = getLocalMigrations();
    const appliedMigrations = await getAppliedMigrations(client);
    
    const appliedMap = new Map();
    for (const am of appliedMigrations) {
      appliedMap.set(am.version, am.applied_at);
    }

    console.log('\n--- Database Migration Status ---');
    console.log(String('Version').padEnd(10) + ' | ' + String('Migration File').padEnd(35) + ' | Status');
    console.log('-'.repeat(65));

    for (const lm of localMigrations) {
      const appliedAt = appliedMap.get(lm.version);
      const statusString = appliedAt 
        ? `Applied at ${new Date(appliedAt).toLocaleString()}` 
        : 'PENDING';
      console.log(lm.version.padEnd(10) + ' | ' + lm.filename.padEnd(35) + ' | ' + statusString);
    }
    console.log('---------------------------------\n');
  } finally {
    await client.end();
  }
}

async function main() {
  const command = process.argv[2];
  try {
    switch (command) {
      case 'up':
        await migrateUp();
        break;
      case 'down':
        await migrateDown();
        break;
      case 'status':
        await displayStatus();
        break;
      default:
        console.error('Usage: npm run migrate:up | migrate:down | migrate:status');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration runner error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getDbClient,
  schemaMigrationsTableExists,
  getAppliedMigrations,
  getLocalMigrations,
  migrateUp,
  migrateDown,
  displayStatus,
  main,
};
