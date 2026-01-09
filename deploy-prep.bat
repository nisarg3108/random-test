@echo off
echo Preparing for deployment...

echo.
echo Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Frontend build completed successfully!
echo Build files are in frontend/dist/

echo.
echo Backend is ready for deployment
echo Make sure to:
echo 1. Set up production database
echo 2. Update backend/.env.production with production values
echo 3. Deploy backend to Railway/Render/Heroku
echo 4. Deploy frontend to Vercel/Netlify

pause