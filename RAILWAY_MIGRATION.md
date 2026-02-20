# Railway Database Migration Guide

## Step 1: Setup Railway PostgreSQL

1. Go to [Railway.app](https://railway.app) and create account
2. Click "New Project" → "Provision PostgreSQL"
3. Click on PostgreSQL service → "Variables" tab
4. Copy the `DATABASE_URL` value (format: `postgresql://user:pass@host:port/dbname`)

## Step 2: Update Local Environment

Replace `DATABASE_URL` in `backend/.env` with Railway's connection string:

```env
DATABASE_URL="postgresql://postgres:PASSWORD@containers-us-west-xxx.railway.app:PORT/railway"
```

## Step 3: Run Migration

```bash
cd backend
npx prisma migrate deploy
```

## Step 4: Seed Database (Optional)

```bash
npm run seed
```

## Step 5: Deploy Backend to Railway

### Option A: Connect GitHub Repository

1. In Railway project, click "New" → "GitHub Repo"
2. Select your repository
3. Railway will auto-detect and deploy

### Option B: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

## Step 6: Set Environment Variables on Railway

In Railway dashboard → Your Service → Variables, add:

```
DATABASE_URL=(already set by Railway PostgreSQL)
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-app-password
SMTP_FROM=ERP System <your-email>
COMPANY_EMAIL_DOMAIN=company.com
DEFAULT_PLAN=Starter Monthly
```

## Verify Migration

Check Railway logs to ensure:
- ✅ Database connection successful
- ✅ Migrations applied
- ✅ Server running

## Rollback (if needed)

```bash
# Reset database
npx prisma migrate reset

# Or restore from backup
pg_restore -d $DATABASE_URL backup.sql
```
