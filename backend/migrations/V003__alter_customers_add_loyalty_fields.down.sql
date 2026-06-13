/**
 * @file        V003__alter_customers_add_loyalty_fields.down.sql
 * @description Rollback for V003.
 */

ALTER TABLE customers DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE customers DROP COLUMN IF EXISTS referred_by;
