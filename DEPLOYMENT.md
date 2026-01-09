# 🚀 ERP System Deployment Guide

## Quick Deployment Steps

### 1. Prepare for Deployment
```bash
deploy-prep.bat
```

### 2. Deploy Backend (Railway - Recommended)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **Create New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Connect Repository**: Select your ERP-SYSTEM-PROJECT repository
4. **Configure Service**:
   - Select `backend` folder as root directory
   - Railway will auto-detect Node.js
5. **Add Database**:
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the DATABASE_URL from the database service
6. **Set Environment Variables**:
   ```
   DATABASE_URL=<your-railway-postgres-url>
   JWT_SECRET=dacba2ba6cd86441390b431766e96db7e099af09786675097e9a45ea98f38d253f7118d7be7d9360171b55f79dbcbb440f6d2ce99aeb59244df2961bc74a62ad
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=5000
   ```
7. **Deploy**: Railway will automatically deploy your backend

### 3. Deploy Frontend (Vercel - Recommended)

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com)
2. **Import Project**: Click "New Project" → Import from Git
3. **Configure Build**:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app/api
   ```
5. **Deploy**: Vercel will build and deploy your frontend

### 4. Database Setup

After backend deployment, run database migrations:
```bash
# Connect to your Railway backend terminal and run:
npx prisma migrate deploy
npx prisma db seed
```

## Alternative Deployment Options

### Backend Alternatives
- **Render**: Similar to Railway, free tier available
- **Heroku**: Classic choice, requires credit card
- **AWS EC2**: More control, requires AWS knowledge

### Frontend Alternatives
- **Netlify**: Similar to Vercel, drag-and-drop deployment
- **GitHub Pages**: Free for public repos
- **AWS S3 + CloudFront**: Professional setup

### Database Alternatives
- **Neon**: Serverless PostgreSQL
- **Supabase**: PostgreSQL with additional features
- **PlanetScale**: MySQL alternative

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-secure-jwt-secret"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="production"
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-url.com/api
```

## Post-Deployment Checklist

- [ ] Backend is accessible at your Railway URL
- [ ] Frontend is accessible at your Vercel URL
- [ ] Database connection is working
- [ ] User registration/login works
- [ ] API endpoints respond correctly
- [ ] CORS is configured for your frontend domain

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update CORS settings in `backend/src/app.js`
   - Add your frontend domain to allowed origins

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Ensure database is running and accessible

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names match exactly

## Custom Domain Setup

### Frontend (Vercel)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Backend (Railway)
1. Go to Service Settings → Networking
2. Add custom domain
3. Configure DNS records

## Monitoring & Maintenance

- Monitor application logs in Railway/Vercel dashboards
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Regular database backups
- Keep dependencies updated

## Support

For deployment issues:
1. Check service provider documentation
2. Review application logs
3. Verify environment variables
4. Test API endpoints manually