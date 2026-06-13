/**
 * @file        migrateMock.test.js
 * @module      MigrationRunnerTest
 * @description Unit tests for the database migration runner using mocked pg client.
 * @layer       util
 * @author      Architect Agent
 * @version     1.0.0
 */

const assert = require('assert');
const Module = require('module');

// Store mock states
let mockQueryCalls = [];
let mockTableExists = false;
let mockAppliedMigrations = [];

// Intercept 'pg' require calls to inject mock PostgreSQL Client
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'pg') {
    return {
      Client: class MockPgClient {
        constructor(config) {
          this.config = config;
        }
        async connect() {
          return true;
        }
        async query(sqlText, params) {
          mockQueryCalls.push({ sqlText, params });
          
          // Mock checking if table exists
          if (sqlText.includes('pg_tables') && sqlText.includes('schema_migrations')) {
            return { rows: [{ exists: mockTableExists }] };
          }
          
          // Mock reading applied migrations
          if (sqlText.includes('SELECT version, filename, applied_at FROM schema_migrations')) {
            return { rows: mockAppliedMigrations };
          }

          // Mock inserting migration tracking record
          if (sqlText.includes('INSERT INTO schema_migrations')) {
            mockAppliedMigrations.push({
              version: params[0],
              filename: params[1],
              applied_at: new Date()
            });
            mockTableExists = true; // Table now exists
            return { rows: [] };
          }

          // Mock deleting migration tracking record
          if (sqlText.includes('DELETE FROM schema_migrations')) {
            mockAppliedMigrations = mockAppliedMigrations.filter(m => m.version !== params[0]);
            return { rows: [] };
          }

          // Mock dropping schema table
          if (sqlText.includes('DROP TABLE IF EXISTS schema_migrations')) {
            mockTableExists = false;
            mockAppliedMigrations = [];
            return { rows: [] };
          }

          return { rows: [] };
        }
        async end() {
          return true;
        }
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

// Now load the migrate module with pg mocked
const migrate = require('../../scripts/migrate');

/**
 * @function  runTests
 * @summary   Orchestrates and executes mock tests for the migration script
 * @returns   {Promise<void>}
 * @throws    {Error} If test assertion fails
 */
async function runTests() {
  console.log('Starting migration mock tests...\n');

  // Test 1: Verify getLocalMigrations parses the local migrations folder
  console.log('Testing: getLocalMigrations()...');
  const local = migrate.getLocalMigrations();
  assert.ok(local.length > 0, 'Should find local migrations');
  assert.strictEqual(local[0].version, 'V001', 'First local migration version should be V001');
  console.log('PASSED\n');

  // Test 2: Verify displayStatus (Status check when DB is empty)
  console.log('Testing: displayStatus() on empty DB...');
  mockTableExists = false;
  mockAppliedMigrations = [];
  mockQueryCalls = [];
  await migrate.displayStatus();
  assert.ok(mockQueryCalls.some(c => c.sqlText.includes('pg_tables')), 'Should query table presence');
  console.log('PASSED\n');

  // Test 3: Verify migrateUp
  console.log('Testing: migrateUp()...');
  mockTableExists = false;
  mockAppliedMigrations = [];
  mockQueryCalls = [];
  await migrate.migrateUp();
  
  // Verify V001 migration was applied
  assert.ok(mockAppliedMigrations.some(m => m.version === 'V001'), 'V001 should be marked applied');
  assert.ok(mockQueryCalls.some(c => c.sqlText.includes('CREATE TABLE schema_migrations')), 'V001 schema creation script should be run');
  assert.ok(mockQueryCalls.some(c => c.sqlText.includes('INSERT INTO schema_migrations')), 'V001 tracking record should be inserted');
  console.log('PASSED\n');

  // Test 4: Verify migrateDown
  console.log('Testing: migrateDown()...');
  mockQueryCalls = [];
  const initialApplied = mockAppliedMigrations.length;
  for (let i = 0; i < initialApplied; i++) {
    await migrate.migrateDown();
  }
  
  // Verify all were rolled back
  assert.strictEqual(mockAppliedMigrations.length, 0, 'No migrations should remain applied after rollback');
  assert.ok(mockQueryCalls.some(c => c.sqlText.includes('DROP TABLE IF EXISTS schema_migrations')), 'V001 down script should be executed');
  console.log('PASSED\n');

  console.log('All migration runner mock tests PASSED successfully!');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
