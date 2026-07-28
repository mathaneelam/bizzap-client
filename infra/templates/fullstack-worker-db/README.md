# Serverless Backend Template — Cloudflare Worker + D1 Database

This is a reusable, production-ready serverless backend template for Bizzap clients using **Hono** web framework, **Cloudflare Workers**, and **Cloudflare D1 (Serverless SQLite)**. 

It implements CORS-enabled REST API endpoints to capture contact form submissions and appointment bookings.

## 🚀 Setup & Deployment Guide

Follow these steps to initialize and deploy this backend for a client:

### 1. Create a D1 SQLite Database
In your terminal, run the following command to create the D1 database instance in Cloudflare:
```bash
npx wrangler d1 create bizzap-db-<client-slug>
```
* Wrangler will output a message containing your new database details. Copy the `database_id` value.

### 2. Update `wrangler.toml`
Paste the copied `database_id` into the `wrangler.toml` file under the D1 databases section:
```toml
[[d1_databases]]
binding = "DB"
database_name = "bizzap-db-<client-slug>"
database_id = "PASTE-DATABASE-ID-HERE"
```

### 3. Initialize Database Tables
Execute the `schema.sql` script to create the `contact_submissions` and `bookings` tables:

**Locally (for local testing):**
```bash
npx wrangler d1 execute bizzap-db-<client-slug> --local --file=schema.sql
```

**Remotely (in production Cloudflare):**
```bash
npx wrangler d1 execute bizzap-db-<client-slug> --remote --file=schema.sql
```

### 4. Run & Test Locally
Start the local worker dev server:
```bash
npm install
npm run dev
```
* Your API will run locally (typically at `http://localhost:8787`).
* You can POST mock submissions to `http://localhost:8787/api/contact` using Postman or curl:
  ```bash
  curl -X POST http://localhost:8787/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name": "Mathan", "phone": "9876543210", "message": "Test inquiry"}'
  ```

### 5. Deploy to Production Cloudflare
Deploy the Worker API to Cloudflare:
```bash
npm run deploy
```
* Note down the live API endpoint URL returned (e.g. `https://bizzap-backend-<client-slug>.<subdomain>.workers.dev`).
* Point your client's static contact form frontend JS call directly to this live API endpoint.
