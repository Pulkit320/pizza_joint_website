# Pizza Joint Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the Pizza Joint application to Vercel. Follow these steps to configure the hosted database, environment variables, migrations, seeds, and scheduled cron jobs.

---

## Prerequisites

- A Vercel Account.
- A GitHub repository containing the Pizza Joint codebase.
- A hosted PostgreSQL instance (recommended providers: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)).

---

## Step 1: Provision the Hosted Database

1. Sign up/log in to your chosen PostgreSQL provider.
2. Create a new database project named `pizza_joint_prod`.
3. Locate your database connection URL (URI). It will look like this:
   `postgresql://[user]:[password]@[host]/pizza_joint_prod?sslmode=require`
4. Copy this connection URL for use in the next steps.

---

## Step 2: Configure Vercel Project & Environment Variables

1. In the Vercel Dashboard, click **New Project** and import the Pizza Joint repository.
2. Under **Configure Project**, expand the **Environment Variables** section.
3. Add the following custom environment variables:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | The connection URL copied in Step 1. Ensure `sslmode=require` is present. |
| `JWT_SECRET` | *[Your Secure Key]* | A long, secure random string. |
| `CRON_SECRET` | *[Your Secret Token]* | A secure API key to protect cron endpoints. |
| `VITE_API_BASE_URL` | `/_/backend/api/v1` | Instructs the React Axios client to use Vercel Services relative routing. |

4. Click **Deploy**. (The first deploy might succeed but the application will not be functional until migrations and seeds are executed).

---

## Step 3: Run Database Migrations & Seeds

Before the app is ready, you must run migrations to build the schema on your hosted database.

### Option A: Local Runner (Recommended)
You can execute the migrations and seeds from your local command line by pointing to the hosted database temporarily:

1. Open your local `.env` file and replace the local credentials with your production `DATABASE_URL`:
   `DATABASE_URL=postgresql://[user]:[password]@[host]/pizza_joint_prod?sslmode=require`
2. Run database migrations:
   ```bash
   npm run migrate:up
   ```
3. Seed the database with employees, products, and shifts:
   ```bash
   npm run seed
   ```
4. Restore your local `.env` database connection back to `localhost` to keep your development workspace clean.

---

## Step 4: Verify Deployment & Cron Jobs

1. Once the deployment finishes, open the production URL (e.g. `https://pizza-joint.vercel.app`).
2. Test registering a customer, logging in, and navigating the menus.
3. Vercel Cron jobs will trigger automatically based on the schedules defined in `vercel.json`:
   - Daily Tier Anniversary Check: `0 2 * * *` (2:00 AM daily)
   - Weekly Employee of the Week: `0 3 * * 1` (3:00 AM every Monday)
4. To test the cron triggers manually, send a POST request to the cron routes with the authorization header:
   ```bash
   curl -X POST https://your-production-url.vercel.app/_/backend/api/cron/tier-check \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## Step 5: Rollback Instructions

If a production update breaks the deployment:
1. To roll back database changes, run the migration runner with the rollback command:
   ```bash
   npm run migrate:down
   ```
2. In the Vercel dashboard, go to the **Deployments** tab, locate the last stable deployment (e.g., tagged `v2.0.0`), click the three dots, and select **Promote to Production** to immediately restore the pre-break code state.
