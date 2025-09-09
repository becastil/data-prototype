# Render Cloud Hosting Deployment Guide

## Complete Guide to Deploying Your Healthcare Analytics Dashboard to Render

This comprehensive guide covers deploying your Next.js healthcare analytics project to Render cloud hosting platform in 2025.

## Table of Contents
1. [Overview](#overview)
2. [Phase Plan](#phase-plan)
3. [Prerequisites](#prerequisites)
4. [Account Setup](#account-setup)
5. [Deployment Options](#deployment-options)
6. [Configuration](#configuration)
7. [Database Setup](#database-setup)
8. [Environment Variables](#environment-variables)
9. [Build Settings](#build-settings)
10. [Deployment Process](#deployment-process)
11. [Post-Deployment](#post-deployment)
12. [Pricing](#pricing)
13. [Troubleshooting](#troubleshooting)

---

## Overview

**Render** is a cloud platform that focuses on simplicity and developer experience, making it an excellent choice for deploying Next.js applications. Key benefits include:

- **Zero Configuration**: Deploy with minimal setup
- **Global CDN**: Lightning-fast content delivery
- **Automatic SSL**: Fully managed TLS certificates
- **Git Integration**: Automatic deploys from GitHub/GitLab/Bitbucket
- **Serverless Functions**: Built-in support for API routes
- **PostgreSQL Database**: Managed database hosting
- **Free Tier**: Available for testing and small projects

### Why Render for This Project?

Your healthcare analytics dashboard is perfect for Render because it:
- Uses Next.js (fully supported)
- Can add database connectivity when needed (PostgreSQL available)
- Needs environment variable management
- Benefits from global CDN for performance
- Can utilize the free tier for development/testing

---

## Phase Plan

This guide is applied in phases to match the actual codebase and reduce risk.

- Phase 1 (Implemented): Baseline Render Web Service without a database
  - Align scripts with Render (`PORT` support)
  - Provide `.env.example` for this project
  - Add `render.yaml` blueprint for one-click deploys
  - Verify Next.js config compatibility
- Phase 2 (Implemented): Optional managed PostgreSQL integration (docs + blueprint)
- Phase 3 (Implemented): Custom domains, monitoring/alerts, and scaling

All three phases are now covered below.

---

## Prerequisites

Before deploying, ensure your project has:

### Required Files (Project-Specific)
- [x] `package.json` with proper scripts (updated for Render)
- [x] `next.config.ts` (TypeScript, already configured)
- [x] `.env.example` (added in Phase 1)
- [x] `render.yaml` (added in Phase 1)

### Project Requirements Met
- [x] Next.js application (✓ You have Next.js 15.5.0)
- [x] Build script configured (✓ `npm run build`)
- [x] Start script configured (✓ `npm start`)
- [x] Dependencies properly listed in package.json
- [x] No hardcoded sensitive data in source code

### Repository Status
- [x] Code pushed to GitHub/GitLab/Bitbucket
- [x] Repository is accessible (public or connected)
- [x] Main branch is deployable

---

## Account Setup

### 1. Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started" 
3. Sign up with GitHub, GitLab, or email
4. Verify your email address
5. Connect your Git provider (GitHub recommended)

### 2. Grant Repository Access
- **For GitHub**: Authorize Render to access your repositories
- **Repository Selection**: Grant access to `data-prototype` repository
- **Permissions**: Allow Render to read repository contents and receive webhooks

---

## Deployment Options

Render offers two deployment types for Next.js applications:

### Option A: Web Service (Recommended)
**Best for**: Full Next.js applications with API routes, SSR, and dynamic features

**Features**:
- Server-side rendering
- API routes support
- Database connections
- Environment variables
- Background jobs
- Custom domains

**Use Case**: Your healthcare dashboard (has API routes and dynamic content)

### Option B: Static Site
**Best for**: Static exports of Next.js applications

**Features**:
- Static file hosting
- CDN delivery
- Custom domains
- Lower cost

**Use Case**: If you export your Next.js app as static HTML/CSS/JS

---

## Configuration

### Next.js Configuration

This project uses `next.config.ts` with `output: 'standalone'` and CSS optimization enabled. No remote image domains are required (no `next/image` remote usage in the repo).

Key settings already present in `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  experimental: { optimizeCss: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  output: 'standalone',
  images: { formats: ['image/webp', 'image/avif'], minimumCacheTTL: 60 },
  webpack: (config) => { /* alias + perf tweaks */ return config; }
};
```

### Package.json Scripts

Updated for Render compatibility (use platform `PORT`):

```json
{
  "scripts": {
    "dev": "next dev -p 3005",
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
```

Note: Windows-specific PowerShell helpers remain available for local development.

---

## Database Setup

### Phase 1 (No Database)

The current application reads from local sample CSV data and does not require a database. You can deploy without provisioning PostgreSQL.

### PostgreSQL on Render (Phase 2)

Render offers managed PostgreSQL databases. For this project, database usage is optional; the app runs on CSV data by default. If you want server-side persistence, follow these steps.

#### Create Database
1. In Render Dashboard, click "New" → "PostgreSQL"
2. Choose plan: Free (dev/testing) or paid (prod)
3. Name: `healthcare-db` (or your choice)
4. Database name: `healthcare_dashboard`
5. Region: Same as your web service
6. Create database and wait for provisioning

#### Get Connection Info
Render provides a connection string, e.g.:

```
postgresql://username:password@host:5432/healthcare_dashboard?sslmode=require
```

Copy this value into your service env as `DATABASE_URL`.

#### Attach to Your Service
Option A — Manual:
- Go to your Web Service → Environment → Add `DATABASE_URL` with the connection string

Option B — Blueprint:
- Use `render.with-db.yaml` (see Appendix) to provision DB and wire `DATABASE_URL` automatically

#### Connect From Next.js (server-only)
If you plan to query the DB, install `pg` and use server files/routes only:

```bash
npm i pg
```

Example connection utility (server-only):

```ts
// app/lib/db.ts (do not import in client components)
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function dbQuery<T = unknown>(text: string, params: unknown[] = []) {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}
```

Then in a server action or route handler, call `dbQuery`.

Notes:
- Keep queries on the server. Never expose `DATABASE_URL` to the client.
- Render’s connection string includes `sslmode=require`; no extra SSL config is needed.
- Add migrations via your preferred tool (Prisma/Drizzle/SQL files) if/when you define a schema.

Render offers managed PostgreSQL databases with the following features:

#### Free Tier Database
- **Storage**: 1GB
- **RAM**: 256MB
- **Expiry**: 30 days (can upgrade to keep data)
- **SSL**: Included
- **Backups**: Manual

#### Paid Database (Starting at $7/month)
- **Storage**: Configurable (starts at 1GB)
- **RAM**: 256MB - 8GB+
- **Features**: 
  - Automated daily backups
  - Point-in-time recovery
  - High availability
  - Private networking
  - Monitoring and alerts

### Database Creation Process

1. **In Render Dashboard**:
   - Click "New" → "PostgreSQL"
   - Choose instance type
   - Set database name: `healthcare_dashboard`
   - Select region (same as web service)
   - Configure storage needs

2. **Connection Details**:
   Render provides these connection details:
   - **Host**: `<database-name>.<region>.render.com`
   - **Database**: Your database name
   - **Username**: Generated username
   - **Password**: Generated password
   - **Port**: 5432

3. **Connection URL Format**:
   ```
   postgresql://username:password@host:port/database
   ```

---

## Environment Variables

### Required for This Project

Based on the codebase (`app/lib/validation.ts`), only these are relevant:

```bash
NODE_ENV=production
# Optional: expose a public API endpoint to the client
# NEXT_PUBLIC_API_URL=https://api.example.com
# Optional: enable bundle analyzer on build
# ANALYZE=true
```

An example file has been added at `.env.example`.

### Phase 2 Variables

If you enable the database:

```bash
DATABASE_URL=postgresql://username:password@host:5432/healthcare_dashboard?sslmode=require
```

### Setting Environment Variables in Render

1. **Via Dashboard**:
   - Select your service
   - Click "Environment" in left panel
   - Click "+ Add Environment Variable"
   - Enter key/value pairs
   - Click "Save Changes"

2. **Bulk Import from .env**:
   - Click "Add from .env"
   - Paste your environment variables
   - Render will parse and add them

3. **Default Variables** (Render provides automatically):
   - `RENDER=true`
   - `RENDER_SERVICE_NAME=your-service-name`
   - `RENDER_GIT_BRANCH=main`
   - `NODE_ENV=production`

### Environment Variable Security

**Important Notes**:
- All environment variable values are strings
- Variables are available at both build and runtime
- Use type conversion in your code: `parseInt(process.env.PORT)`
- Never commit `.env` files to Git
- Use `NEXT_PUBLIC_` prefix only for client-side variables

---

## Build Settings

### Web Service Configuration

When creating your web service, use these settings:

#### Basic Settings
- **Service Name**: `healthcare-dashboard`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (unless in monorepo)

#### Build Settings
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  npm ci && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

#### Advanced Settings
- **Node Version**: Render auto-detects from `.nvmrc` or uses latest LTS
- **Auto-Deploy**: Yes (deploys on Git push)

### Custom Build Commands (If Needed)

For more complex builds:

```bash
# Install dependencies and build
npm ci && npm run build

# With cache clearing
npm ci --cache /tmp/.npm && npm run build

# With specific Node version
node --version && npm ci && npm run build

# With pre-build scripts
npm run prebuild && npm ci && npm run build
```

---

## Deployment Process

### Step-by-Step Deployment (Phase 1)

#### 1. Create Web Service
1. Log into Render Dashboard
2. Click "New" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Choose your `data-prototype` repository
5. Configure service settings:

#### 2. Service Configuration
```
Name: healthcare-dashboard
Environment: Node
Region: Oregon (US West) or closest to users
Branch: main
Root Directory: (leave empty)
Build Command: npm ci && npm run build
Start Command: npm start  # uses $PORT
```

#### 3. Advanced Configuration
- **Auto-Deploy**: ✅ Yes
- **Environment Variables**: Add all required variables
  - Phase 1: none required by default
  - Phase 2: add `DATABASE_URL` (from Render Postgres)
- **Health Check Path**: `/` (or custom health endpoint)

#### 4. Deploy
1. Click "Create Web Service"
2. Render will:
   - Clone your repository
   - Install dependencies
   - Run build command
   - Start the application
   - Assign a URL: `https://healthcare-dashboard-xxxx.onrender.com`

### Deployment Timeline

- **Initial Deploy**: 5-10 minutes
- **Subsequent Deploys**: 2-5 minutes
- **Cold Start** (free tier): Up to 30 seconds

---

## Post-Deployment

### 1. Verify Deployment

Check these after deployment:

- [ ] Application loads at assigned URL
- [ ] Database connections work
- [ ] Environment variables are set correctly
- [ ] CSV upload functionality works
- [ ] Charts render properly
- [ ] Theme toggle functions
- [ ] No console errors

### 2. Custom Domains (Phase 3)

1. **In Render Dashboard**:
   - Go to your service settings
   - Click "Custom Domains"
   - Add your domain: `yourdomain.com`

2. **DNS Configuration**:
   - Preferred: CNAME `www` → `your-app.onrender.com`
   - Apex/root domain: use ANAME/ALIAS if your DNS supports it, or Render-provided A records
   - Add both apex and `www` for best coverage, and set a redirect in Render

3. **SSL Certificate**:
   - Render automatically provisions SSL certificates
   - Usually takes 5-10 minutes to activate; renewals are automatic

### 3. Monitoring and Maintenance (Phase 3)

#### Available Metrics
- CPU usage
- Memory consumption
- Request response times
- Error rates
- Build/deploy history

#### Logging
- Access logs in Render Dashboard
- Stream to external providers (Datadog, Grafana)
- Set up alerts for errors

#### Maintenance Tasks
- Monitor database usage (approaching 1GB on free tier)
- Review performance metrics
- Update dependencies regularly
- Monitor environment variable security

#### Health Checks
- A dedicated health endpoint is included: `GET /api/health`
- Blueprints set `healthCheckPath: /api/health` for faster, more reliable checks
- Use this path for external uptime monitors (Pingdom, UptimeRobot, Better Uptime)

#### Alerts
- In Render, add notifications for deploy failures and crash loops
- Optionally integrate an external uptime monitor to alert on downtime

---

## Pricing

### Free Tier Limitations
- **Web Services**:
  - Sleep after 15 minutes of inactivity
  - 750 hours/month of usage
  - 100GB bandwidth
  - Shared CPU/memory
  
- **PostgreSQL**:
  - 1GB storage
  - Expires after 30 days
  - No automated backups

### Paid Plans (Starting $7/month)

#### Web Service ($7/month)
- Always-on (no sleeping)
- 1 vCPU, 512MB RAM
- 100GB bandwidth
- Custom domains
- Priority support

#### Database ($7/month)
- 1GB storage (configurable)
- 256MB RAM
- Automated backups
- Point-in-time recovery
- Monitoring/alerts
- No expiration

### Cost Optimization Tips

1. **Development/Testing**: Use free tier
2. **Production**: Start with $7 web service + $7 database = $14/month
3. **Scale Up**: Increase resources as needed
4. **Monitoring**: Track usage to optimize costs
5. **Instances**: For higher traffic, increase instance size or instance count (requires paid tiers)
6. **Cold Starts**: Avoid free tier for production to eliminate sleep/cold start delays

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Build Failures

**Issue**: Build command fails
```bash
npm ERR! Missing script: "build"
```

**Solution**: 
- Verify `package.json` has build script
- Check for typos in build command
- Ensure all dependencies are listed

**Issue**: Out of memory during build
```bash
JavaScript heap out of memory
```

**Solution**:
- Use build command: `NODE_OPTIONS="--max-old-space-size=1024" npm run build`
- Or upgrade to higher memory instance

#### 2. Runtime Issues

**Issue**: Application fails to start
```bash
Error: Cannot find module 'next'
```

**Solution**:
- Verify dependencies in `package.json`
- Check start command: `npm start` or `next start`
- Ensure build was successful

**Issue**: Database connection fails (Phase 2)
```bash
Connection refused at host:5432
```

**Solution**:
- Verify `DATABASE_URL` environment variable
- Check database is running
- Confirm connection string format

#### 3. Performance Issues

**Issue**: Slow page loads

**Solutions**:
- Enable Next.js optimization features
- Implement proper caching headers
- Optimize images and assets
- Consider upgrading service tier

**Issue**: Cold starts (free tier)

**Solutions**:
- Upgrade to paid tier for always-on service
- Implement health check endpoint
- Consider external monitoring to keep alive

#### 4. Environment Variable Issues

**Issue**: Variables not available at runtime

**Solutions**:
- Check variable names for typos
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Restart service after adding variables
- Verify correct environment (development vs production)

### Getting Help

#### Documentation Resources
- [Render Docs](https://render.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Render Community Forum](https://community.render.com)

#### Support Channels
- **Free Tier**: Community support, documentation
- **Paid Tier**: Priority support, faster response times
- **GitHub Issues**: For platform-specific problems

---

## Conclusion

Render provides an excellent platform for deploying your healthcare analytics dashboard with minimal configuration and maximum developer experience. The combination of:

- Simple deployment process
- Managed PostgreSQL database
- Automatic SSL and CDN
- Environment variable management
- Reasonable pricing

Makes it ideal for both development and production hosting of your Next.js application.

### Next Steps

1. [x] Set up Render account
2. [x] Ensure scripts/env/blueprint present in repo (Phase 1)
3. [ ] Deploy to free tier for testing
4. [ ] Test all functionality
5. [ ] Set up custom domain (if needed)
6. [ ] Upgrade to paid tier for production
7. [ ] Set up monitoring and alerts

Your healthcare dashboard should be live and accessible within 15 minutes of starting the deployment process!

---

## Additional Resources

- [Render Pricing Calculator](https://render.com/pricing)
- [Next.js on Render Examples](https://github.com/render-examples/nextjs)
- [Render Blueprint Templates](https://render.com/docs/blueprint-spec)
- [PostgreSQL Connection Guides](https://render.com/docs/databases)

*Last Updated: January 2025*

---

## Appendix: Blueprint (`render.yaml`)

Phase 1 includes a Render Blueprint for one-click deploys:

```yaml
services:
  - type: web
    name: healthcare-dashboard
    env: node
    plan: free
    branch: main
    rootDir: .
    buildCommand: npm ci && npm run build
    startCommand: npm start
    autoDeploy: true
    healthCheckPath: /api/health
    envVars:
      - key: NEXT_PUBLIC_API_URL
        sync: false
```

You can import this file in the Render Dashboard (Blueprint deploy) or keep using the standard “New → Web Service” flow.

### Appendix B: Blueprint with Managed Postgres (`render.with-db.yaml`)

Provisions a free Postgres instance and injects `DATABASE_URL` into the web service:

```yaml
databases:
  - name: healthcare-db
    databaseName: healthcare_dashboard
    plan: free

services:
  - type: web
    name: healthcare-dashboard
    env: node
    plan: free
    branch: main
    rootDir: .
    buildCommand: npm ci && npm run build
    startCommand: npm start
    autoDeploy: true
    healthCheckPath: /api/health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: healthcare-db
          property: connectionString
```

Use this when you want a managed DB attached automatically.
