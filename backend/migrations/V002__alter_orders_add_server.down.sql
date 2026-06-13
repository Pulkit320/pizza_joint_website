/**
 * @file        V002__alter_orders_add_server.down.sql
 * @description Rollback for V002.
 */

ALTER TABLE orders DROP COLUMN IF EXISTS server_employee_id;
