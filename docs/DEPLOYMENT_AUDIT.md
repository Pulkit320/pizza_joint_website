# Pizza Joint Deployment Audit: Vercel Compatibility (v2.0)

This audit documents incompatibilities between the existing codebase and Vercel's serverless hosting platform, outlining how each is addressed to ensure a successful production deployment.

---

## 1. Audit Findings & Platform Incompatibilities

### Issue 1: Persistent listening via `app.listen()`
* **File(s) affected**: `/backend/server.js`
* **Why it breaks on Vercel**: Vercel runs in a serverless environment where HTTP requests trigger individual function invocations on demand. Persistent listeners like `app.listen()` are not supported and will cause function execution to time out or be ignored by Vercel's serverless router.
* **Proposed fix**: Extract the Express application instance construction, routes, and middleware registration into `/backend/src/app.js` and export it. `/backend/server.js` will serve exclusively as the local development entry point, importing `/backend/src/app.js` and calling `app.listen()`. A serverless entry point at `/api/index.js` will export the same app instance for Vercel's runtime.

### Issue 2: In-Memory Blacklist State
* **File(s) affected**: `/backend/src/utils/tokenBlacklist.js`
* **Why it breaks on Vercel**: The token blacklist currently utilizes an in-memory `Set` to store logged-out token JTIs. Serverless environments are stateless, scale horizontally across multiple instances, and recycle container processes regularly. An in-memory cache will be lost on container recycle and cannot be shared across different function instances, allowing blacklisted tokens to remain valid.
* **Proposed fix**: Replace the in-memory `Set` with a persistent database table `token_blacklist`. Create a database migration `V013__create_token_blacklist.sql` to establish the table, and update the blacklist utility to perform async database operations (`INSERT` on logout, `SELECT` on authentication). Add a cron clean-up query to remove expired entries.

### Issue 3: Direct pg.Pool Database Connections
* **File(s) affected**: `/backend/src/config/db.js`
* **Why it breaks on Vercel**: The client currently instantiates a connection pool using individual host, port, user, and password parameters. Serverless functions open new connections on scaling, which can quickly exhaust the database's max connection limit. Additionally, hosted serverless-friendly Postgres providers (like Neon, Supabase, Railway) typically supply a single unified connection string.
* **Proposed fix**: Refactor `db.js` to read from a single `DATABASE_URL` environment variable. If the variable is present, configure the connection pool to use it. If the connection requires SSL (e.g., Neon), automatically apply `ssl: { rejectUnauthorized: false }`. Fall back to individual `DB_HOST`, `DB_PORT` etc. variables for local development compatibility.

### Issue 4: Transaction Lockings (`SELECT FOR UPDATE`)
* **File(s) affected**: `/backend/src/services/loyaltyService.js` and `/backend/src/models/loyaltyModel.js`
* **Why it breaks on Vercel**: While `SELECT FOR UPDATE` is supported by Postgres, using connection pooling models in "Transaction pooling" mode (e.g. pgBouncer transaction mode) can cause lock context mix-ups or premature releases. 
* **Proposed fix**: Retain transactional logic but document in the deployment guide that the hosted database connection string must point to the transaction-safe/session pool port (e.g., direct port or transaction-safe port) rather than a statement/transaction pooler port to ensure that locks remain valid for the duration of the transaction.

### Issue 5: File Uploads & Local File Writes
* **File(s) affected**: None
* **Why it breaks on Vercel**: Serverless runtimes have a read-only filesystem (with the exception of `/tmp`). Persistent local writes are discarded when the function container recycles.
* **Proposed fix**: None required. An audit of the backend codebase confirms that no local file writes or upload middleware (like Multer) are utilized.

### Issue 6: Background Polling Jobs
* **File(s) affected**: None (previously invoked via manual triggers in `/admin` routes)
* **Why it breaks on Vercel**: Serverless functions cannot run long-lived background loops or interval-based schedulers (`setInterval`/`setTimeout`). While the backend has no intervals, scheduled jobs (such as the daily tier check and weekly EOTW calculation) must run automatically rather than depending on manual admin clicks.
* **Proposed fix**: Expose secure, cron-friendly serverless endpoints (`/api/cron/tier-check` and `/api/cron/employee-of-week`) that verify a `CRON_SECRET` authorization header. Configure Vercel's scheduler using a root `/vercel.json` file to trigger these endpoints on the required cron schedules.

### Issue 7: Cross-Origin Resource Sharing (CORS) Configuration
* **File(s) affected**: `/backend/server.js` (no CORS middleware registered)
* **Why it breaks on Vercel**: Deploying frontend and backend on different domains would trigger CORS blocks.
* **Proposed fix**: Since the project is deployed as a Vercel monorepo, both the React frontend and the Express API are routed under the same domain. The routing rewrites in `/vercel.json` ensure that `/api/*` requests are routed to serverless function endpoints, while other paths fall through to the React build. This maintains a same-origin execution context, eliminating the need for CORS setup.

### Issue 8: Hardcoded localhost URLs in Frontend Services
* **File(s) affected**: `/frontend/src/services/apiService.js`
* **Why it breaks on Vercel**: The Axios instance is hardcoded to connect to `http://localhost:3000/api/v1`. On the deployed production build, browsers would attempt to communicate with the client's local port instead of the deployed backend.
* **Proposed fix**: Replace the hardcoded base URL with `import.meta.env.VITE_API_BASE_URL`. Configure `/frontend/.env.example` to document this variable. In production, this will be set in the Vercel dashboard to `/api/v1` (or the deployed URL) to use same-origin relative paths.

---

## 2. Explanation of vercel.json Rewrites Order

In `/vercel.json`, we configure routing as follows:
```json
"rewrites": [
  { "source": "/api/(.*)", "destination": "/api/$1" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```
The order of these rules is critical:
1. **API Requests First**: The first rule matches any route prefixed with `/api/` and routes it to the serverless function under `/api/index.js`. 
2. **React SPA Fallback**: The second rule acts as a catch-all. If a path does not begin with `/api/`, it falls through to `/index.html`. This allows React Router to handle client-side routing for nested frontend URLs (e.g. `/rewards`, `/admin/employees`) without Vercel attempting to look for corresponding physical files on the server, which would otherwise result in `404 Not Found` errors.
