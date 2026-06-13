# Pizza Joint Deployment Environment Variables Reference

This document outlines all environment variables required to run the Pizza Joint application in both production (Vercel) and local development.

---

## 1. Custom Environment Secrets (Set in Vercel Dashboard / local .env)

These variables must be manually configured in the Vercel project settings dashboard under **Settings > Environment Variables** for the production environment.

| Variable Name | Description | Required in Prod? | Recommended Production Value | Local Development Value |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | The full PostgreSQL connection string to the hosted database. Must include database credentials. | **Yes** | `postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require` | `postgresql://postgres:pizza@localhost:5432/pizza_joint_db?sslmode=disable` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens (JWT) for customer and staff sessions. | **Yes** | A long, randomly generated secure string. | `super_secret_dev_pizza_token_key_12345` |
| `CRON_SECRET` | A secure bearer token used to authenticate scheduled Vercel Cron jobs and prevent unauthorized execution. | **Yes** | A high-entropy random API token. | Any string (e.g., `local-cron-secret-key-999`) |
| `VITE_API_BASE_URL` | The base URL for the backend API consumed by Axios in the React frontend. | **Yes** | `/api/v1` (uses relative path for same-origin routing) | `http://localhost:3000/api/v1` |
| `NODE_ENV` | Identifies the current environment execution mode. | No (Vercel defaults this) | `production` | `development` |
| `PORT` | Local server port binding. Not used by Vercel serverless. | No | *N/A* | `3000` |
| `LOYALTY_POINTS_PER_RUPEE` | Points earned per rupee spent (default `0.1` = 1 point per 10 rupees). | No | `0.1` | `0.1` |
| `LOYALTY_REDEMPTION_RATE` | Point value per rupee (default `10` = 10 points per 1 rupee discount). | No | `10` | `10` |
| `LOYALTY_EXPIRY_MONTHS` | Number of months before points expire. | No | `12` | `12` |

---

## 2. Vercel System Environment Variables

Vercel automatically injects these system environment variables into your serverless functions at runtime. You do not need to configure these in the dashboard.

| Variable Name | Description | Value |
| :--- | :--- | :--- |
| `VERCEL` | Flag indicating the code is running on Vercel. | `1` |
| `VERCEL_ENV` | The environment of the current deployment. | `production`, `preview`, or `development` |
| `VERCEL_URL` | The domain name of the deployment. | E.g. `pizza-joint.vercel.app` |
| `CRON_SECRET` | System-injected cron security key (if enabled via Vercel dashboard). Can be used as the automated bearer token. | E.g., `cron_sec_...` |
