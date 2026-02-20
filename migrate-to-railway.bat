@echo off
echo ========================================
echo Railway Database Migration Fix Script
echo ========================================
echo.

cd backend

echo.
echo Step 1: Generating Prisma Client...
set DATABASE_URL=postgresql://postgres:PHMfhwXSttXRKzsFHFtooLdiyXgRSYcl@trolley.proxy.rlwy.net:33836/railway
call npx prisma generate
if %errorlevel% neq 0 (
    echo Error: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo Step 2: Marking partial migration as applied (tables already exist)...
call npx prisma migrate resolve --applied 20260202032023_add_asset_management
if %errorlevel% neq 0 (
    echo Warning: Resolve failed - migration may already be resolved. Continuing...
)

echo.
echo Step 3: Applying ALL pending migrations (22 missing migrations)...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo Error: Failed to run migrations. Check the error above.
    pause
    exit /b 1
)

echo.
echo Step 4: Verifying migration status...
call npx prisma migrate status

echo.
echo Step 5: Seeding Database (Optional)...
set /p seed="Do you want to seed the database? (y/n): "
if /i "%seed%"=="y" (
    call npx prisma db seed
)

echo.
echo ========================================
echo Migration Complete! All tables created.
echo ========================================
echo.
echo Missing tables now applied:
echo  - AssetManagement, Reports, Communication
echo  - Inventory, Finance, Manufacturing
echo  - CRM, AP Module, Project Enhancements
echo  - Email Queue, Subscription, Payments
echo  - and 10+ more migrations
echo.
echo Next Steps:
echo 1. Go to Railway → Redeploy your backend service
echo 2. Check logs - server should start successfully
echo.
pause
