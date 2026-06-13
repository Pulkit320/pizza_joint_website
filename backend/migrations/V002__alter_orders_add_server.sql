/**
 * @file        V002__alter_orders_add_server.sql
 * @description Migration to add server_employee_id to orders table.
 */

ALTER TABLE orders ADD COLUMN IF NOT EXISTS server_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
COMMENT ON COLUMN orders.server_employee_id IS 'Reference to the employee who served or processed the order';
