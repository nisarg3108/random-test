# Deployment Guide: Vercel + Railway

## Overview
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway (with PostgreSQL)

---

## 🚂 Part 1: Deploy Backend to Railway

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy PostgreSQL"
3. Wait for PostgreSQL to provision

### Step 3: Add Backend Service
1. Click "New" → "GitHub Repo"
2. Select your ERP-SYSTEM-PROJECT repository
3. Set root directory: `backend`

### Step 4: Configure Environment Variables
In Railway backend service settings, add:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-secure-random-string-min-32-chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
SEED_KEY=your-secure-seed-key-change-this
```

**Important**: 
- `${{Postgres.DATABASE_URL}}` automatically references your Railway PostgreSQL
- Generate a secure JWT_SECRET (use: `openssl rand -base64 32`)
- Update FRONTEND_URL after deploying to Vercel

### Step 5: Configure Build Settings
Railway auto-detects Node.js. Verify:
- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `npx prisma migrate deploy && npm start`

### Step 6: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Copy your Railway URL (e.g., `https://your-app.railway.app`)

---

## ▲ Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 2: Import Project
1. Click "Add New" → "Project"
2. Import your ERP-SYSTEM-PROJECT repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variable
In Vercel project settings → Environment Variables:

```
VITE_API_URL=https://your-railway-app.railway.app/api
```

Replace with your actual Railway backend URL from Part 1, Step 6.

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment
3. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

---

## 🔄 Part 3: Update CORS Settings

### Update Backend CORS
Go back to Railway → Backend Service → Variables:

Update `FRONTEND_URL` to your Vercel URL:
```
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy the backend service.

---

## ✅ Part 4: Verify Deployment

### Test Backend
```bash
curl https://your-railway-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### Test Frontend
1. Open your Vercel URL
2. Try logging in
3. Check browser console for errors

---

## 🔧 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in Railway matches PostgreSQL service
- Check Railway logs: `railway logs`

### CORS Errors
- Ensure `FRONTEND_URL` in Railway matches your Vercel domain
- Check backend CORS settings in `src/app.js`

### Build Failures

**Frontend**:
- Check Node.js version (should be 18+)
- Verify all dependencies in `package.json`

**Backend**:
- Ensure Prisma generates correctly
- Check migration files in `prisma/migrations`

### Environment Variables Not Working
- Restart services after adding variables
- Verify variable names match exactly (case-sensitive)

---

## 📝 Post-Deployment Setup

### 1. Initialize Database
The migrations run automatically on first deploy.

### 2. Seed Database

**After backend is deployed, trigger seed via API:**
```bash
curl -X POST https://your-railway-app.railway.app/api/admin/seed \
  -H "Authorization: Bearer your-seed-key-from-env"
```

**Or manually create admin via API:**
```bash
curl -X POST https://your-railway-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "name": "Admin User",
    "role": "ADMIN"
  }'
```

### 3. Initialize Workflows
Login as admin and navigate to Finance > Finance Approvals, then click "Initialize Workflow".

---

## 🔄 Continuous Deployment

Both platforms auto-deploy on git push:
- **Vercel**: Deploys on push to main branch
- **Railway**: Deploys on push to main branch

To disable auto-deploy, check platform settings.

---

## 💰 Cost Estimates

### Railway (Backend + Database)
- **Hobby Plan**: $5/month (500 hours)
- **Pro Plan**: $20/month (unlimited)

### Vercel (Frontend)
- **Hobby**: Free (personal projects)
- **Pro**: $20/month (commercial use)

---

## 🔐 Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database password
- [ ] Enable Railway/Vercel 2FA
- [ ] Set up custom domain with HTTPS
- [ ] Review CORS settings
- [ ] Enable rate limiting
- [ ] Set up monitoring/alerts

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
