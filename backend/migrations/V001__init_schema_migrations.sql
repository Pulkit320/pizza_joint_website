/**
 * @file        V001__init_schema_migrations.sql
 * @module      Migrations
 * @description Creates the schema migrations tracking table.
 * @layer       config
 * @author      Architect Agent
 * @version     1.0.0
 */

CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(10) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
