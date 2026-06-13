# Pizza Joint Database Schema Documentation (v2.0)

This document provides a comprehensive overview of the database schema for the Pizza Joint website project, including standard tables (pre-v2.0) and new tables introduced in version 2.0.

---

## Entity Relationship Summary

The Pizza Joint database manages core entities (Customers, Employees, Orders, Products, and Order Items) alongside new features introduced in v2.0 (Loyalty Program, Customer Referrals, and Order/Employee Reviewing/Rating systems).

1. **Core Entities**:
   - **Customers** place **Orders**.
   - An **Order** consists of multiple **Order Items**, each linked to a specific **Product**.
   - **Employees** are responsible for processing and serving orders. In v2.0, a server-to-order relation is introduced: an **Order** optionally points to a serving **Employee** via `server_employee_id`.

2. **Loyalty Program**:
   - Each **Customer** has at most one **Loyalty Account** (`loyalty_accounts`), tracking their current points balance, total points earned, and membership tier.
   - All changes to a customer's loyalty balance are logged in the immutable **Loyalty Ledger** (`loyalty_ledger`). This ledger tracks individual events (e.g. earning points from orders, referrals, reviews, or admin grants) and references the associated **Customer**, **Loyalty Account**, and optionally the **Order** that triggered it.

3. **Referrals**:
   - **Customers** can refer other people. The **Referrals** table tracks the relation between the `referrer_customer_id` and the `referred_customer_id` (a customer can only be referred once, hence `referred_customer_id` is unique).
   - Once the referred customer completes their first order, the referral record is updated to link to that order, mark the bonus as paid, and record the payment timestamp.

4. **Reviews & Ratings**:
   - A customer can review an order once. **Order Reviews** (`order_reviews`) store overall score metrics (overall, food quality, service speed) and comments.
   - For every reviewed order, customers can rate individual items. The **Order Item Ratings** (`order_item_ratings`) table acts as a child of `order_reviews` and links individual items and products to their specific scores (1 to 5).
   - Separately, customers can rate the employee who served their order. The **Employee Ratings** (`employee_ratings`) table tracks the rating score, custom tags, comments, and admin exclusion/moderation status.

5. **Employee of the Week (EOTW) Selections**:
   - Tracks Employee of the Week calculation outcomes. The `eotw_selections` table records the winning employee for a calendar week along with the audit scores and fallback conditions used for calculations.

---

## Table Definitions

### Existing Tables

#### 1. `employees`
Stores employee profiles and credentials.
- `id` (UUID, NOT NULL, PK): Unique identifier for the employee.
- `first_name` (VARCHAR, NOT NULL): Employee's first name.
- `last_name` (VARCHAR, NOT NULL): Employee's last name.
- `email` (VARCHAR, NOT NULL, UNIQUE): Employee's email address.
- `role` (VARCHAR, NOT NULL): The role of the employee (e.g. manager, chef, server, driver).
- `created_at` (TIMESTAMPTZ, NOT NULL): Timestamp when the employee was hired/created.

#### 2. `customers`
Stores customer registration profiles.
- `id` (UUID, NOT NULL, PK): Unique identifier for the customer.
- `first_name` (VARCHAR, NOT NULL): Customer's first name.
- `last_name` (VARCHAR, NOT NULL): Customer's last name.
- `email` (VARCHAR, NOT NULL, UNIQUE): Customer's email.
- `phone` (VARCHAR, Nullable): Customer's phone number.
- `date_of_birth` (DATE, Nullable): *[NEW v2.0]* Customer's date of birth, used for birthday multipliers.
- `referred_by` (UUID, Nullable, FK -> `customers.id`): *[NEW v2.0]* References the customer who referred them.
- `created_at` (TIMESTAMPTZ, NOT NULL): Account creation timestamp.

#### 3. `products`
Stores pizza menu items and prices.
- `id` (UUID, NOT NULL, PK): Unique identifier for the product menu item.
- `name` (VARCHAR, NOT NULL): Product name (e.g. "Pepperoni Feast").
- `description` (TEXT, Nullable): Short description of the product and toppings.
- `price` (NUMERIC, NOT NULL): Price of the product.
- `created_at` (TIMESTAMPTZ, NOT NULL): Timestamp when the product was added.

#### 4. `orders`
Tracks purchases made by customers.
- `id` (UUID, NOT NULL, PK): Unique identifier of the order.
- `customer_id` (UUID, NOT NULL, FK -> `customers.id`): Customer who placed the order.
- `status` (VARCHAR, NOT NULL): Current state (e.g. "pending", "completed", "cancelled").
- `total_amount` (NUMERIC, NOT NULL): Total price of the order.
- `server_employee_id` (UUID, Nullable, FK -> `employees.id`): *[NEW v2.0]* References the employee who served the order.
- `created_at` (TIMESTAMPTZ, NOT NULL): Order placement timestamp.

#### 5. `order_items`
Child table of `orders` detailing line items.
- `id` (UUID, NOT NULL, PK): Unique identifier of the order item line.
- `order_id` (UUID, NOT NULL, FK -> `orders.id`): Parent order.
- `product_id` (UUID, NOT NULL, FK -> `products.id`): Ordered product menu item.
- `quantity` (INTEGER, NOT NULL): Quantity ordered.
- `unit_price` (NUMERIC, NOT NULL): Price per unit at the time of purchase.

---

### New Tables (Introduced in v2.0)

#### 6. `order_reviews`
Stores overall feedback left by customers on orders.
- `id` (UUID, NOT NULL, PK): Unique identifier for the review. Defaults to `gen_random_uuid()`.
- `order_id` (UUID, NOT NULL, FK -> `orders.id` ON DELETE CASCADE): The reviewed order.
- `customer_id` (UUID, NOT NULL, FK -> `customers.id` ON DELETE CASCADE): Customer submitting the review.
- `overall_score` (SMALLINT, NOT NULL): Score from 1 to 5.
- `food_quality_score` (SMALLINT, NOT NULL): Score from 1 to 5.
- `speed_score` (SMALLINT, NOT NULL): Score from 1 to 5.
- `written_comment` (VARCHAR(500), Nullable): Optional text review.
- `would_order_again` (BOOLEAN, Nullable): Flag indicating future order intent.
- `created_at` (TIMESTAMPTZ, NOT NULL): Auto-defaults to `NOW()`.
- *Constraints:* UNIQUE (`order_id`, `customer_id`) ensures only one review is allowed per order.

#### 7. `order_item_ratings`
Stores ratings of specific menu items within a reviewed order.
- `id` (UUID, NOT NULL, PK): Unique identifier. Defaults to `gen_random_uuid()`.
- `review_id` (UUID, NOT NULL, FK -> `order_reviews.id` ON DELETE CASCADE): Parent review.
- `order_item_id` (UUID, NOT NULL, FK -> `order_items.id` ON DELETE CASCADE): Rated order item.
- `product_id` (UUID, NOT NULL, FK -> `products.id` ON DELETE CASCADE): Rated product menu item.
- `item_score` (SMALLINT, NOT NULL): Score from 1 to 5.

#### 8. `employee_ratings`
Tracks ratings given by customers to employee servers.
- `id` (UUID, NOT NULL, PK): Unique rating identifier. Defaults to `gen_random_uuid()`.
- `employee_id` (UUID, NOT NULL, FK -> `employees.id` ON DELETE CASCADE): The rated server.
- `order_id` (UUID, NOT NULL, FK -> `orders.id` ON DELETE CASCADE): Associated order.
- `customer_id` (UUID, NOT NULL, FK -> `customers.id` ON DELETE CASCADE): Reviewing customer.
- `service_score` (SMALLINT, NOT NULL): Score from 1 to 5.
- `written_note` (VARCHAR(200), Nullable): Optional short note.
- `tags` (`employee_rating_tag[]`, Nullable): Array of qualities (e.g. `'friendly'`, `'fast'`).
- `is_excluded` (BOOLEAN, NOT NULL): Admin flag to suppress malicious ratings. Defaults to `FALSE`.
- `excluded_reason` (TEXT, Nullable): Reason why the review was moderated.
- `excluded_by` (UUID, Nullable, FK -> `employees.id` ON DELETE SET NULL): Admin moderator employee ID.
- `excluded_at` (TIMESTAMPTZ, Nullable): Time of exclusion.
- `created_at` (TIMESTAMPTZ, NOT NULL): Defaults to `NOW()`.
- *Constraints:* UNIQUE (`employee_id`, `order_id`, `customer_id`) prevents duplicate service ratings per order.

#### 9. `loyalty_accounts`
Tracks customer point balance and membership levels.
- `id` (UUID, NOT NULL, PK): Unique loyalty account identifier. Defaults to `gen_random_uuid()`.
- `customer_id` (UUID, NOT NULL, UNIQUE, FK -> `customers.id` ON DELETE CASCADE): Owner of the account.
- `current_balance` (INTEGER, NOT NULL): Current spendable points. Defaults to `0`. Must be `>= 0`.
- `lifetime_points_earned` (INTEGER, NOT NULL): Lifetime point accumulation. Defaults to `0`.
- `current_tier` (`loyalty_tier`, NOT NULL): Current tier (`'dough'`, `'crust'`, or `'legend'`). Defaults to `'dough'`.
- `tier_anniversary_date` (DATE, NOT NULL, default `NOW()::DATE + INTERVAL '1 year'`): Set to one year from account creation. Re-evaluated on this date to check whether the customer's prior-year earning justifies their current tier.
- `last_activity_at` (TIMESTAMPTZ, NOT NULL): Timestamp of last activity for expiration tracking. Defaults to `NOW()`.
- `expiry_warning_sent_at` (TIMESTAMPTZ, Nullable): Log of when inactivity notices were dispatched.
- `created_at` (TIMESTAMPTZ, NOT NULL): Defaults to `NOW()`.
- `updated_at` (TIMESTAMPTZ, NOT NULL): Managed by database trigger `trg_loyalty_accounts_updated_at`.

#### 10. `loyalty_ledger`
Immutable transaction log of all loyalty events.
- `id` (UUID, NOT NULL, PK): Unique transaction identifier. Defaults to `gen_random_uuid()`.
- `customer_id` (UUID, NOT NULL, FK -> `customers.id` ON DELETE CASCADE): Customer whose points are altered.
- `loyalty_account_id` (UUID, NOT NULL, FK -> `loyalty_accounts.id` ON DELETE CASCADE): Affected loyalty account.
- `order_id` (UUID, Nullable, FK -> `orders.id` ON DELETE SET NULL): Order that triggered the transaction, if any.
- `event_type` (`loyalty_event_type`, NOT NULL): Event type (e.g. `'order_earn'`, `'redemption'`).
- `points_delta` (INTEGER, NOT NULL): Positive for earn events, negative for redemptions or expiries.
- `balance_after` (INTEGER, NOT NULL): Account balance post-transaction. Must be `>= 0`.
- `note` (TEXT, Nullable): Required explanation for `'admin_grant'` or `'expiry'`.
- `issued_by` (UUID, Nullable, FK -> `employees.id` ON DELETE SET NULL): Admin employee who issued a grant.
- `created_at` (TIMESTAMPTZ, NOT NULL): Defaults to `NOW()`.
- *Constraints:* Enforces `note` presence on admin grants and point expiries.

#### 11. `referrals`
Tracks the invitation of new customers and referral bonus payouts.
- `id` (UUID, NOT NULL, PK): Unique referral identifier. Defaults to `gen_random_uuid()`.
- `referrer_customer_id` (UUID, NOT NULL, FK -> `customers.id` ON DELETE CASCADE): Referring customer.
- `referred_customer_id` (UUID, NOT NULL, UNIQUE, FK -> `customers.id` ON DELETE CASCADE): Referred customer.
- `referral_bonus_paid` (BOOLEAN, NOT NULL): Whether the referring customer has received points. Defaults to `FALSE`.
- `bonus_paid_at` (TIMESTAMPTZ, Nullable): Time when the referral bonus was paid out.
- `bonus_order_id` (UUID, Nullable, FK -> `orders.id` ON DELETE SET NULL): Referred customer's first purchase.
- `created_at` (TIMESTAMPTZ, NOT NULL): Defaults to `NOW()`.
- *Constraints:* Referrers cannot refer themselves (`referrer_customer_id <> referred_customer_id`). The bonus details must be logged when `referral_bonus_paid` is true.

#### 12. `eotw_selections`
Stores the result of each Employee of the Week calculation run.
- `id` (UUID, NOT NULL, PK): Unique selection identifier. Defaults to `gen_random_uuid()`.
- `employee_id` (UUID, NOT NULL, FK -> `employees.id` ON DELETE CASCADE): The winning employee.
- `week_start_date` (DATE, NOT NULL, UNIQUE): The Monday that starts the calendar week this employee won for.
- `avg_service_rating` (NUMERIC(4,2), Nullable): Audit column for employee service rating average.
- `orders_processed_ratio` (NUMERIC(4,2), Nullable): Audit column for employee processing ratio.
- `punctuality_score` (NUMERIC(4,2), Nullable): Audit column for employee punctuality ratio.
- `final_weighted_score` (NUMERIC(6,4), NOT NULL): Calculated weight total used to declare a winner.
- `used_store_avg_for_rating` (BOOLEAN, NOT NULL): True if store average fallback was applied due to low reviews (< 10). Defaults to `FALSE`.
- `is_manual_override` (BOOLEAN, NOT NULL): True if selection represents a manager's custom winner choice. Defaults to `FALSE`.
- `override_reason` (TEXT, Nullable): Explanation text for overrides.
- `overridden_by` (UUID, Nullable, FK -> `employees.id` ON DELETE SET NULL): Manager who authorized the override.
- `calculated_at` (TIMESTAMPTZ, NOT NULL): Auto-defaults to `NOW()`.

---

## Index Strategy Explanation

Indexes are created in `V010__create_indexes.sql` (and inline in `V011__create_eotw_selections.sql`) to optimize database query performance and handle constraint cascading.

1. **Foreign Key Performance**: PostgreSQL does not automatically index foreign keys. To speed up joins and prevent table scans when records are updated or deleted from base tables (like `orders`, `customers`, or `employees`), indexes exist on:
   - `loyalty_ledger(customer_id, loyalty_account_id, order_id, issued_by)`
   - `employee_ratings(employee_id, order_id, customer_id, excluded_by)`
   - `order_reviews(order_id, customer_id)`
   - `order_item_ratings(review_id, order_item_id, product_id)`
   - `referrals(referrer_customer_id, bonus_order_id)`
   - `eotw_selections(employee_id, overridden_by)` *(created in V011)*

2. **Frequent Queries**:
   - `loyalty_ledger(customer_id)`: Speeds up customer ledger logs retrieval.
   - `employee_ratings(employee_id)`: Optimizes server performance dashboard metric aggregates.
   - `referrals(referrer_customer_id)`: Speeds up referral list dashboards.
   - `order_reviews(customer_id)`: Quick retrieval of reviews left by specific customers.

---

## Rollback Plan

To rollback the entire database state back to v1.0.0, execute the companion migration down scripts in reverse version order:

```sql
-- 1. Rollback V012: Drop trigger and updated_at trigger function
DROP TRIGGER IF EXISTS trg_loyalty_accounts_updated_at ON loyalty_accounts;
DROP FUNCTION IF EXISTS set_updated_at();

-- 2. Rollback V011: Drop eotw_selections
DROP INDEX IF EXISTS idx_eotw_selections_overridden_by;
DROP INDEX IF EXISTS idx_eotw_selections_employee_id;
DROP TABLE IF EXISTS eotw_selections CASCADE;

-- 3. Rollback V010: Drop indexes
DROP INDEX IF EXISTS idx_customers_referred_by;
DROP INDEX IF EXISTS idx_employee_ratings_customer_id;
DROP INDEX IF EXISTS idx_employee_ratings_employee_id;
DROP INDEX IF EXISTS idx_employee_ratings_excluded_by;
DROP INDEX IF EXISTS idx_employee_ratings_order_id;
DROP INDEX IF EXISTS idx_loyalty_ledger_customer_id;
DROP INDEX IF EXISTS idx_loyalty_ledger_issued_by;
DROP INDEX IF EXISTS idx_loyalty_ledger_loyalty_account_id;
DROP INDEX IF EXISTS idx_loyalty_ledger_order_id;
DROP INDEX IF EXISTS idx_order_item_ratings_order_item_id;
DROP INDEX IF EXISTS idx_order_item_ratings_product_id;
DROP INDEX IF EXISTS idx_order_item_ratings_review_id;
DROP INDEX IF EXISTS idx_order_reviews_customer_id;
DROP INDEX IF EXISTS idx_order_reviews_order_id;
DROP INDEX IF EXISTS idx_orders_server_employee_id;
DROP INDEX IF EXISTS idx_referrals_bonus_order_id;
DROP INDEX IF EXISTS idx_referrals_referrer_customer_id;

-- 4. Rollback V009: Drop referrals
DROP TABLE IF EXISTS referrals CASCADE;

-- 5. Rollback V008: Drop loyalty ledger
DROP TABLE IF EXISTS loyalty_ledger CASCADE;
DROP TYPE IF EXISTS loyalty_event_type CASCADE;

-- 6. Rollback V007: Drop loyalty accounts
DROP TABLE IF EXISTS loyalty_accounts CASCADE;
DROP TYPE IF EXISTS loyalty_tier CASCADE;

-- 7. Rollback V006: Drop employee ratings
DROP TABLE IF EXISTS employee_ratings CASCADE;
DROP TYPE IF EXISTS employee_rating_tag CASCADE;

-- 8. Rollback V005: Drop reviews and ratings
DROP TABLE IF EXISTS order_item_ratings CASCADE;
DROP TABLE IF EXISTS order_reviews CASCADE;

-- 9. Rollback V004: Disable pgcrypto extension
DROP EXTENSION IF EXISTS "pgcrypto";

-- 10. Rollback V003: Drop altered columns from customers
ALTER TABLE customers DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE customers DROP COLUMN IF EXISTS referred_by;

-- 11. Rollback V002: Drop altered column from orders
ALTER TABLE orders DROP COLUMN IF EXISTS server_employee_id;
```

---

## Known Limitations

- **Referral cycle prevention**: The database enforces a constraint preventing a customer from referring themselves (`referrer_customer_id <> referred_customer_id`). Multi-hop cycle prevention (e.g. A refers B, B refers A) is the responsibility of the application layer in the referral service. The database does not and cannot efficiently enforce this with a constraint. The referral service must query the referrals table to confirm no reverse relationship exists before inserting a new referral row.

---

## Assumptions about existing tables

The following design assumptions were made regarding pre-existing tables to guarantee compatibility:
1. **UUID Primary Keys**: It is assumed that `employees`, `orders`, `order_items`, `products`, and `customers` all use `UUID` as their primary key type (`id` column).
2. **PostgreSQL Compatibility**: Assumes extensions (like `pgcrypto` or native uuid routines generating random values via `gen_random_uuid()`) are available and configured.
3. **No Foreign Key Violations**: Assumes table names and schema schemas match exactly. Specifically:
   - `employees.id` exists and is of type `UUID`.
   - `orders.id` exists and is of type `UUID`.
   - `order_items.id` exists and is of type `UUID`.
   - `products.id` exists and is of type `UUID`.
   - `customers.id` exists and is of type `UUID`.
