# Review Submission

This document serves as the final submission of the project scaffolding work for the **Pizza Joint** project.

---

## 1. Task Completion Checklist

- [x] **1. REPOSITORY STRUCTURE**
  - [x] Created `/backend/` directory structure exactly as specified.
  - [x] Created `/frontend/` directory structure exactly as specified.
  - [x] Created `/docs/` directory structure exactly as specified.
  - [x] Created `/scripts/` directory structure.
  - [x] Placed clean scaffolding entrypoints and placeholder files (e.g., `server.js`, controllers, models, components, hooks, contexts, services, utils, API/DB/decision docs) matching the directory layout.
- [x] **2. VERSION CONTROL**
  - [x] Initialized Git repository local workspace.
  - [x] Configured root `.gitignore` ignoring dependencies (`node_modules`), secrets (`.env`), build directories, logs, and OS files.
  - [x] Created and structured branches: `main` (production-stable), `develop` (integration), and `feature/scaffold` (scaffolding).
  - [x] Created `docs/BRANCHING_GUIDE.md` detailing branching workflows, code review merges, release tagging, and tag-based rollback instructions.
- [x] **3. DATABASE MIGRATION SYSTEM**
  - [x] Initialized root `package.json` declaring `migrate:up`, `migrate:down`, and `migrate:status` script runners.
  - [x] Created `scripts/migrate.js` using `pg` to execute raw SQL, check metadata table existence, run migrations in transactions, and log output.
  - [x] Implemented alphabetical/chronological ordering by sorting `Vxxx__` prefixes.
  - [x] Created `backend/migrations/V001__init_schema_migrations.sql` to initialize the tracking table.
  - [x] Created `backend/migrations/V001__init_schema_migrations.down.sql` to support rollback verification.
- [x] **4. ENVIRONMENT CONFIGURATION**
  - [x] Created `backend/.env.example` defining Server, Database (PostgreSQL), Auth (JWT), and Loyalty Program variables.
- [x] **5. COMMENTING STANDARD**
  - [x] Applied file-level JSDoc blocks to every created JavaScript, JSX, and SQL file.
  - [x] Added JSDoc blocks (defining summary, parameters, returns, and throws) to all functions and classes.
- [x] **6. VARIABLE NAMING STANDARD**
  - [x] Enforced casing standards (camelCase variables/functions, PascalCase components/classes, snake_case DB entities, SCREAMING_SNAKE_CASE constants/env vars, kebab-case route segments) across all files.
  - [x] Created `docs/NAMING_CONVENTIONS.md` mapping out and documenting these exact naming and commenting rules.
- [x] **7. ARCHITECTURE DOCUMENTATION**
  - [x] Created `docs/ARCHITECTURE.md` containing the ASCII directory tree, stack choices, React-to-Postgres sequence data flow, migration system, branching summary, and documentation links.

---

## 2. Assumptions Made About the Existing Database

1. **PostgreSQL Relational DB:** We assume the external database is a standard PostgreSQL instance, allowing the use of the `pg` client driver.
2. **Metadata Table Auto-creation & Check:** We assume the migration runner can query PostgreSQL catalog tables (`pg_tables`) to check for the presence of the `schema_migrations` table. If it does not exist, the runner assumes no migrations have been applied and executes the initialization scripts.
3. **Local Credentials:** We assume local development does not require SSL database connections. We can add optional SSL parameter checks to the connection pool if production environments require encrypted connections later.

---

## 3. Architectural Decisions

1. **Root `package.json` Workspace Configuration:** We decided to set up `package.json` at the project root rather than solely inside the `backend` folder. This allows developer-friendly execution of migrations (`npm run migrate:up`) from the project root without having to change directories.
2. **Companion `.down.sql` Files:** Since arbitrary SQL statements cannot be programmatically reversed (e.g. a `CREATE TABLE` is reversed by `DROP TABLE`, but custom `ALTER` commands require complex reversion SQL), we decided to pair each `Vxxx__*.sql` migration with a matching `Vxxx__*.down.sql` script to serve as the rollback code for `migrate:down`.
3. **Transaction isolation:** To prevent partial migration failure states (where some SQL statements execute successfully but others fail, corrupting the schema), we wrapped each migration execution and its tracking record insertion inside a single transaction pool block (`BEGIN` / `COMMIT`). On error, we execute a `ROLLBACK`.
4. **React Frontend Layer Mapping:** Since the commenting guidelines mandate mapping files to specific layers (`config`, `controller`, `middleware`, `model`, `route`, `service`, `util`), we mapped frontend entities as follows:
   - React custom hooks -> `util` layer
   - Custom utility functions -> `util` layer
   - Reusable React UI components -> `controller` layer (acting as UI controllers)
   - Route-mapped page components -> `route` layer (matching pages to client routes)
   - API client calls -> `service` layer (interfacing with backend APIs)
   - React context providers -> `config` layer (managing state provider config)

---

## 4. Questions for the Programming Lead

1. **Local DB Docker Container:** Do we want to include a `docker-compose.yml` file to scaffold a local PostgreSQL container automatically, making database set up easy for new developers joining the project?
2. **Auto-enforcement (Linters/Git Hooks):** Should we set up ESLint/Prettier configuration and configure pre-commit hooks (via Husky) to automatically enforce the comment headers and variable/class casing naming standards before commits are accepted?
3. **Frontend Bootstrapping:** For bootstrapping the React frontend, should we use Vite/Next.js? Do we want to manage frontend and backend under a single monorepo setup using NPM Workspaces?
4. **Initial Schema Mapping:** Do we have a SQL dump of the existing PostgreSQL database schema to write our initial model queries, or should we expect the existing database schema to be documented in `docs/db/` first?
