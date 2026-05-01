Deployment Checklist - Backend

1. Environment
- Set `DATABASE_URL` for Prisma/Postgres
- Set `JWT_SECRET`, `SMTP` vars, and any payment provider keys
- Configure `NODE_ENV=production` when deploying

2. Database
- Run migrations: `npx prisma migrate deploy`
- Run seed if required: `npm run seed`

3. Build & Start
- Install deps: `npm ci`
- Start app: `NODE_ENV=production node src/server.js` or use PM2/systemd

4. Verify
- Health endpoint: `GET /api/health`
- Run test runner: `node tests/test-runner.js payroll admin@example.com admin123`

5. Backups & Monitoring
- Ensure DB backups and log aggregation (ELK/LogDNA)
- Configure alerts for high error rates

6. Rollback
- Keep previous release artifact and DB snapshot available for rollback
