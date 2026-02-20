@echo off
echo ========================================
echo ERP System - Deployment Setup
echo ========================================
echo.

echo This script will help you prepare for deployment to Vercel and Railway.
echo.

echo Step 1: Installing Railway CLI...
npm install -g @railway/cli
echo.

echo Step 2: Installing Vercel CLI...
npm install -g vercel
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run 'railway login' to authenticate with Railway
echo 2. Run 'vercel login' to authenticate with Vercel
echo 3. Follow the instructions in DEPLOYMENT.md
echo.
echo Quick Deploy Commands:
echo   Backend:  cd backend ^&^& railway up
echo   Frontend: cd frontend ^&^& vercel
echo.

pause
