@echo off
echo Setting up ERP System...

echo.
echo 1. Installing Backend Dependencies...
cd backend
call npm install

echo.
echo 2. Generating Prisma Client...
call npx prisma generate

echo.
echo 3. Running Database Migrations...
call npx prisma migrate deploy

echo.
echo 4. Installing Frontend Dependencies...
cd ..\frontend
call npm install

echo.
echo Setup completed successfully!
echo.
echo To start the development servers, run: start-dev.bat
echo.
pause