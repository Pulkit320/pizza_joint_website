/**
 * @file        V003__alter_customers_add_loyalty_fields.sql
 * @description Migration to add date_of_birth and referred_by to customers table.
 */

ALTER TABLE customers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES customers(id) ON DELETE SET NULL;
COMMENT ON COLUMN customers.date_of_birth IS 'Customer date of birth, used for birthday reward multipliers';
COMMENT ON COLUMN customers.referred_by IS 'Reference to the customer who referred this customer';
