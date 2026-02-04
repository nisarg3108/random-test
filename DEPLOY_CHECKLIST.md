# 🚀 Deployment Checklist - Railway + Vercel

## Pre-Deployment Preparation ✅

### 1. Ensure Code is Committed
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## 🔧 PART 1: Deploy Backend to Railway

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**

### Step 2: Add PostgreSQL Database
1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Wait for database to provision
3. Note: `DATABASE_URL` will be automatically provided to your backend service

### Step 3: Deploy Backend Service
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your `ERP-SYSTEM-PROJECT` repository
3. Click **"Add variables"** and configure:

#### Required Environment Variables:
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=dacba2ba6cd86441390b431766e96db7e099af09786675097e9a45ea98f38d253f7118d7be7d9360171b55f79dbcbb440f6d2ce99aeb59244df2961bc74a62ad
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-app.vercel.app
```

#### Optional Email Variables (for notifications):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com
COMPANY_EMAIL_DOMAIN=yourcompany.com
```

### Step 4: Configure Build Settings
1. Go to **Settings** → **General**
2. Set **Root Directory**: `backend`
3. Set **Start Command**: `npm start`

### Step 5: Deploy
1. Railway will automatically deploy
2. Wait for deployment to complete (check **Deployments** tab)
3. Copy your backend URL (e.g., `https://your-backend.up.railway.app`)

### Step 6: Run Database Migrations
1. In Railway, go to your backend service
2. Open **Settings** → **Variables** tab
3. Click on **"Deploy"** tab
4. Click **"View Logs"** to ensure deployment succeeded
5. Go to backend service → Click **"..."** → **"Service"** → **"Terminal"**
6. Or use Railway CLI:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run npx prisma migrate deploy

# Seed database
railway run npx prisma db seed
```

---

## 🎨 PART 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**

### Step 2: Import Repository
1. Find your `ERP-SYSTEM-PROJECT` repository
2. Click **"Import"**

### Step 3: Configure Build Settings
```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add:
```env
VITE_API_URL=https://your-backend.up.railway.app/api
```
**Important**: Replace `your-backend.up.railway.app` with your actual Railway backend URL!

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Copy your frontend URL (e.g., `https://your-app.vercel.app`)

### Step 6: Update Backend FRONTEND_URL
1. Go back to Railway
2. Update the `FRONTEND_URL` variable with your Vercel URL
3. Redeploy backend service

---

## ✅ Post-Deployment Verification

### Test Backend
```bash
# Health check
curl https://your-backend.up.railway.app/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

### Test Frontend
1. Open your Vercel URL in browser
2. Try to register a new user
3. Try to login
4. Check if dashboard loads

### Common URLs to Test:
- ✅ Frontend: `https://your-app.vercel.app`
- ✅ Backend: `https://your-backend.up.railway.app`
- ✅ API: `https://your-backend.up.railway.app/api`
- ✅ Health: `https://your-backend.up.railway.app/api/health`

---

## 🔧 Troubleshooting

### Backend Issues

**Database Connection Failed**
```bash
# Check DATABASE_URL is set correctly
railway variables

# Test connection
railway run npx prisma db pull
```

**Build Failed**
- Check logs in Railway dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### Frontend Issues

**Build Failed**
- Check Vercel deployment logs
- Verify root directory is set to `frontend`
- Check for TypeScript/ESLint errors

**API Connection Failed**
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Inspect browser console for errors

**Blank Page**
- Check browser console
- Verify build output in Vercel logs
- Check `vercel.json` rewrites configuration

---

## 🎯 Quick Links

- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs

---

## 📝 Notes

- Railway free tier: $5/month credit
- Vercel free tier: Unlimited deployments
- Database backups: Configured in Railway automatically
- Auto-deploys: Enabled on git push to main branch

## 🔄 Future Updates

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Both Railway and Vercel will automatically redeploy!
