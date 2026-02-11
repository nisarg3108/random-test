@echo off
REM ERP System Test Runner
REM Usage: run-tests.bat [module] [email] [password]

echo.
echo ========================================
echo   ERP System - Test Suite Runner
echo ========================================
echo.

REM Check if backend server is running
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend server is not running!
    echo Please start the backend server first:
    echo   cd backend
    echo   npm run dev
    echo.
    pause
    exit /b 1
)

echo [OK] Backend server is running
echo.

REM Set default values
set MODULE=%1
set EMAIL=%2
set PASSWORD=%3

if "%MODULE%"=="" set MODULE=all
if "%EMAIL%"=="" set EMAIL=admin@example.com
if "%PASSWORD%"=="" set PASSWORD=admin123

echo Running tests for: %MODULE%
echo Using credentials: %EMAIL%
echo.

cd backend
node tests/test-runner.js %MODULE% %EMAIL% %PASSWORD%

echo.
echo ========================================
echo   Test Run Complete
echo ========================================
echo.
pause
