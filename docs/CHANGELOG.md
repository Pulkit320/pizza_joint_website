# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Integration Test Suite**: Added a comprehensive black-box integration test suite in `tests/api/` using plain Node.js fetch (no testing framework dependencies). Contains:
  - `common.js`: Shared database cleanups, entity seedings, HTTP requests, and assertion utilities.
  - `auth.test.js`: Focuses on customer registration, duplicate validation checks, login credentials verification, and route guards.
  - `reviews.test.js`: Checks order review bounds, duplicate review checks, and employee-order link rating constraints.
  - `loyalty.test.js`: Checks first order bonus point deposits, review bonus points, redemption limits, and positive ledger constraints.
  - `employees.test.js`: Checks Employee of the Week scoring runs and minimum rating counts average fallback logic.
- **Master System Documentation**: Created `docs/MASTER_DOC.md` containing repository layout diagrams, developer environment setup guides, database ER mappings, API route lists, and React frontend component hierarchies.

---

## [0.1.0] - 2026-06-03

### Added
- **Database Migrations (v2.0)**: Added PostgreSQL migration scripts `V002` through `V010` introducing tables for order reviews, order item ratings, employee ratings, loyalty accounts, loyalty ledger transactions, referrals, and employee of the week selections.
- **Loyalty Programme Integration**: Implemented backend controllers, models, and services representing the customer loyalty lifecycle. Points are earned on orders (based on tier multipliers, referrals, and birthday bonuses) and reviews, and redeemed at checkout.
- **Employee of the Week Automated System**: Developed weighted score algorithm calculations combining punctuality ratings, order processing counts, and service scores, falling back to store averages for low-rated employees.
- **React Frontend Portals**: Implemented customer portals (Rewards tracker, Order checkout discount inputs, Order History, Review pages) and admin operational panels (Sales graphs, employee rosters, manual triggers).

### Changed
- **Orders Relation**: Altered `orders` table to include `server_employee_id` representing the staff member who processed the order.
- **Customers Relation**: Altered `customers` table to add `date_of_birth` and `referred_by` foreign keys.
