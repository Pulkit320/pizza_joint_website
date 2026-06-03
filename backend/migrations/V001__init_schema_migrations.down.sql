/**
 * @file        V001__init_schema_migrations.down.sql
 * @module      Migrations
 * @description Drops the schema migrations tracking table.
 * @layer       config
 * @author      Architect Agent
 * @version     1.0.0
 */

DROP TABLE IF EXISTS schema_migrations CASCADE;
