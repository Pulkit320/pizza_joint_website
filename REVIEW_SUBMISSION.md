# Review Submission — Vercel Deployment Configuration Audit

This document summarizes the audit and serverless restructuring completed to make the Pizza Joint application deployable to Vercel.

---

## 1. Audit Findings & Executed Fixes

A comprehensive audit was performed to transition the codebase from a persistent Express server architecture to a serverless architecture on Vercel:

1.  **Persistent HTTP Server (`app.listen`)**:
    *   *Issue*: The persistent `app.listen()` block in `server.js` is incompatible with serverless function environments.
    *   *Fix*: Extracted the core Express configuration (middleware, routing, error handlers) into a modular `/backend/src/app.js` export. Retained `/backend/server.js` as the local development entry point calling `.listen()` only when run directly. Created a root serverless gateway at `/api/index.js` exporting `app.js` for Vercel's runtime.
2.  **In-Memory Session Blacklist**:
    *   *Issue*: `tokenBlacklist.js` used an in-memory `Set` to track logged-out JWT JTIs, which resets on container recyclings and is not shared across horizontal function scaling.
    *   *Fix*: Created a new DB migration (`V013__create_token_blacklist.sql`) to establish a persistent `token_blacklist` table. Refactored the `tokenBlacklist` utility, `authMiddleware`, and `authService` to perform asynchronous DB queries (`INSERT` and `SELECT EXISTS`) to manage the session blacklist.
3.  **Scheduled Intervals**:
    *   *Issue*: Background scheduled loops are unsupported in serverless functions.
    *   *Fix*: Created two serverless cron routes `/api/cron/tier-check.js` (daily tier anniversary checks & expired blacklist cleanup) and `/api/cron/employee-of-week.js` (weekly Employee of the Week calculation). Secured both endpoints with `CRON_SECRET` bearer token validation.
4.  **Database Connection Pooling**:
    *   *Issue*: Separate host/user connection parameters fail to pool connections efficiently in serverless scale-outs and do not support hosted connection strings.
    *   *Fix*: Refactored `/backend/src/config/db.js` to parse unified `DATABASE_URL` connections, automatically enabling SSL mode (`rejectUnauthorized: false`) for hosted PostgreSQL databases (Neon, Supabase, Railway) in production while falling back to local credentials in development.
5.  **Hardcoded Frontend Base URL**:
    *   *Issue*: The frontend services hardcoded the API client base URL to `http://localhost:3000/api/v1`.
    *   *Fix*: Externalized the Axios base URL in `/frontend/src/services/apiService.js` to pull from `import.meta.env.VITE_API_BASE_URL`, defaulting to `/api/v1` for relative same-origin routing in production. Added `/frontend/.env.example` to document this variable.

---

## 2. Secrets Verification Status

*   **Secrets Audit Status**: **PASSED**
*   **Verification Details**: An exhaustive regex search was executed across all tracked codebase files in the repository for common secret signatures (`postgresql://`, `password`, `secret`). No hardcoded API keys, database credentials, or secret variables are committed. The only credentials present are local development environment variables located in ignored `.env` templates.

---

## 3. Vercel Routing Configuration Explanation

The routing rules defined in `/vercel.json` are organized as follows:
*   **API Cron Gateways**: Directs `/api/cron/tier-check` and `/api/cron/employee-of-week` requests to their corresponding serverless handler files.
*   **API Requests**: Rewrites any route prefixed with `/api/*` to the serverless function gateway `/api/index.js` to ensure Express handles routing.
*   **Frontend SPA Fallback**: Rewrites all non-API routes `/.*` to `/index.html`. This ensures that frontend paths (e.g., `/rewards`, `/admin/employees`) are client-side routed by React Router rather than raising a Vercel 404 page error.

---

## 4. Git Version History & Release Tagging

The repository version history has been updated to reflect the full evolution of features and deployment prep. The current commit history is clean and structured:

*   **Tag: `v2.0.0`**: Created a release tag marking the completed Pizza Joint application feature set prior to deployment restructuring.
*   **Deployment Commits**:
    1.  `chore: restructure backend for serverless deployment`
    2.  `feat: add token blacklist DB table (replaces in-memory store)`
    3.  `feat: add Vercel cron endpoints for tier check and EOTW calc`
    4.  `chore: configure environment variables for hosted database`
    5.  `chore: update frontend to use environment-based API URL`
    6.  `chore: add vercel.json deployment configuration`
    7.  `docs: add deployment audit, env vars reference, and deploy guide`
*   **Tag: `v2.1.0-deploy-ready`**: Created an annotated rollback/release tag representing the finalized, verified deployment configuration.

---

## 5. Remote Repository Status Warning

> [!WARNING]
> **No Remote Origin Configured:**
> No git remote origin is currently configured for this repository. All commits and release tags (`v2.0.0`, `v2.1.0-deploy-ready`) have been successfully recorded in the local repository history. Pushing changes to GitHub requires the programming lead to provide the remote repository URL:
> ```bash
> git remote add origin <REMOTE_REPOSITORY_URL>
> git push -u origin develop --tags
> ```
