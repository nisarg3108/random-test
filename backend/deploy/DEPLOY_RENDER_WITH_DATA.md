# Deploy Backend to Render With Existing Data

This flow deploys backend on Render and migrates your full local PostgreSQL data.

## 1) Create Render Services

1. Create a PostgreSQL service in Render.
2. Create a Web Service from this repo:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npx prisma migrate deploy && npm start`

You can also use `backend/render.yaml` as reference.

## 2) Configure Environment Variables in Render Web Service

Set at minimum:

- `NODE_ENV=production`
- `PORT=5000`
- `DATABASE_URL=<Render internal DB connection string>`
- `JWT_SECRET=<strong random value>`
- `JWT_EXPIRY=7d`
- `FRONTEND_URL=<your frontend URL>`
- `SEED_KEY=<strong random value>`

Set mail/billing variables only if you use those modules.

## 3) First Deploy

Deploy once from Render dashboard so service starts and migrations are available.

## 4) Restore Local Data Into Render Postgres

Use Render Postgres external connection string in the command below.

From repo root:

```powershell
Set-Location .\backend
.\deploy\db\restore-to-target.ps1 -TargetDatabaseUrl "postgresql://USER:PASSWORD@HOST:PORT/DBNAME"
```

Optional: specify a particular dump file:

```powershell
Set-Location .\backend
.\deploy\db\restore-to-target.ps1 -TargetDatabaseUrl "postgresql://USER:PASSWORD@HOST:PORT/DBNAME" -BackupFile ".\deploy\db\local-backup-YYYYMMDD-HHMMSS.dump"
```

## 5) Redeploy Backend

Redeploy the web service in Render dashboard after restore.

## 6) Verify

Run:

```bash
curl https://YOUR-RENDER-BACKEND.onrender.com/api/health
```

Expected HTTP 200 with DB connected.

## Notes

- Local backup dump files are ignored by git via `backend/.gitignore`.
- Restore uses `--clean --if-exists`, so target tables are replaced by backup content.
- Keep one fresh backup before every restore.
