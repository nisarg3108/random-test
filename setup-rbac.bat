@echo off
echo ========================================
echo  RBAC System Setup Script
echo ========================================
echo.

echo Step 1: Installing dependencies...
cd backend
call npm install
cd ..

echo.
echo Step 2: Running RBAC setup...
cd backend
node setup-rbac.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✅ RBAC System Setup Complete!
    echo ========================================
    echo.
    echo Next Steps:
    echo 1. Start your backend server: npm run dev
    echo 2. Navigate to /role-management in your app
    echo 3. Assign roles to your users
    echo.
    echo See RBAC_IMPLEMENTATION_GUIDE.md for details
    echo.
) else (
    echo.
    echo ========================================
    echo  ❌ Setup Failed
    echo ========================================
    echo.
    echo Please check the error messages above
    echo.
)

pause
