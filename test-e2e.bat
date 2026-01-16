@echo off
echo 🚀 ERP System - End-to-End Inventory Approval Test
echo.

REM Step 1: Login as ADMIN
echo 🔐 Step 1: Login as ADMIN
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"password123\"}"

echo.
echo 📝 Copy the token from above response and set it as ADMIN_TOKEN
echo.
set /p ADMIN_TOKEN="Enter ADMIN_TOKEN: "

REM Step 2: Create inventory item
echo.
echo 📦 Step 2: Create inventory item (should trigger approval)
curl -X POST http://localhost:5000/api/inventory ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%" ^
  -d "{\"name\":\"Test Item\",\"sku\":\"TEST-%RANDOM%\",\"price\":99.99,\"quantity\":10,\"description\":\"Test approval workflow\"}"

echo.
echo.
echo 🔍 Step 3: Check Prisma Studio for pending approvals
echo   1. Run: npx prisma studio
echo   2. Go to Approval table
echo   3. Find record with status = "PENDING"
echo   4. Copy the approvalId
echo.
set /p APPROVAL_ID="Enter APPROVAL_ID from Prisma Studio: "

REM Step 4: Approve the workflow
echo.
echo ✅ Step 4: Approve the workflow
curl -X POST http://localhost:5000/api/workflows/approve ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%" ^
  -d "{\"approvalId\":\"%APPROVAL_ID%\"}"

echo.
echo.
echo 🎉 End-to-End test completed!
pause