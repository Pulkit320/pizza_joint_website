# Coding and Naming Conventions

This document defines the strict casing, naming, and commenting conventions enforced across the **Pizza Joint** project. All scaffolded files and future feature implementations must comply with these guidelines.

---

## 1. Naming Conventions

| Category | Convention | Examples |
| :--- | :--- | :--- |
| **Variables** | `camelCase` | `customerPoints`, `orderTotal`, `hasLoyaltyAccount` |
| **Functions** | `camelCase` | `getOrderById()`, `calculateLoyaltyPoints()`, `verifyToken()` |
| **Constants** | `SCREAMING_SNAKE_CASE` | `MAX_REDEMPTION_PERCENT`, `DEFAULT_PAGE_LIMIT` |
| **Classes** | `PascalCase` | `LoyaltyService`, `DatabaseConfig`, `CustomerController` |
| **Database Tables** | `snake_case` | `loyalty_ledger`, `customers`, `products`, `schema_migrations` |
| **Database Columns** | `snake_case` | `created_at`, `employee_id`, `applied_at`, `points_earned` |
| **React Components** | `PascalCase` | `ProductCard`, `AdminDashboard`, `LoyaltySummary` |
| **React Hooks** | `camelCase` prefixed with `use` | `useOrderHistory()`, `useLoyaltyPoints()`, `useAuth()` |
| **Environment Variables** | `SCREAMING_SNAKE_CASE` | `DB_HOST`, `JWT_SECRET`, `PORT`, `NODE_ENV` |
| **API Route Segments** | `kebab-case` | `/api/order-history`, `/api/loyalty-points`, `/api/customers/:id` |

---

## 2. Commenting Standard

All code files and functions must include descriptive JSDoc block comments to facilitate code readability, IDE autocomplete, and automated documentation generation.

### File-Level Headers
Every code file (JavaScript, JSX, TypeScript, TSX) must open with a file-level comment block:

```javascript
/**
 * @file        <filename.ext>
 * @module      <ModuleName>
 * @description <One-sentence explanation of what this file does.>
 * @layer       <config | controller | middleware | model | route | service | util>
 * @author      Architect Agent
 * @version     1.0.0
 */
```

### Layer Definitions
- `config`: Handles configuration files, environment variables setup, and client connection setups (e.g. database pools).
- `controller`: The request handler functions that interface with HTTP routes.
- `middleware`: Functions executing before controllers, such as authentication, validation, and error handlers.
- `model`: Modules that write and execute raw SQL queries to interface with PostgreSQL.
- `route`: Registers express routes, maps them to controllers, and applies middleware.
- `service`: House all business logic rules, calculations, and external integrations.
- `util`: Reusable utilities, custom helper functions, and hooks.

### Function JSDoc
Every function must be preceded by a JSDoc block:

```javascript
/**
 * @function  <functionName>
 * @summary   <One-line description of the function's purpose>
 * @param     {<Type>}  <paramName>  - <Description of the parameter>
 * @returns   {<Type>}  <Description of the returned value>
 * @throws    {<Error>} <When this function throws and why>
 */
```
