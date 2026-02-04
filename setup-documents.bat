@echo off
echo ========================================
echo Document Management System Setup
echo ========================================
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo [2/4] Running database migration...
call npx prisma migrate dev --name add_document_management
if errorlevel 1 (
    echo ERROR: Failed to run migration
    echo Make sure your DATABASE_URL is set correctly in .env
    pause
    exit /b 1
)
echo ✓ Database migration completed
echo.

echo [3/4] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo [4/4] Creating upload directories...
if not exist "src\modules\documents\uploads" mkdir "src\modules\documents\uploads"
echo ✓ Upload directories created
echo.

cd ..

echo ========================================
echo Setup Complete! 
echo ========================================
echo.
echo Next steps:
echo 1. Start backend: cd backend ^&^& npm run dev
echo 2. Start frontend: cd frontend ^&^& npm run dev
echo 3. Navigate to http://localhost:5173/documents
echo.
echo For detailed documentation, see:
echo - DOCUMENT_MANAGEMENT_QUICK_START.md
echo - DOCUMENT_MANAGEMENT_IMPLEMENTATION.md
echo.
pause
