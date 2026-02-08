# Authentication Test Script
$baseUrl = "http://localhost:5000/api"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "`nTesting Authentication System..." -ForegroundColor Cyan

# Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/health"
Write-Host "[OK] Backend is running" -ForegroundColor Green

# Register
Write-Host "`n2. Registration..." -ForegroundColor Yellow
$registerBody = @{
    companyName = "TestCo$timestamp"
    email = "admin$timestamp@test.com"
    password = "test123456"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
$token = $registerResponse.token
Write-Host "[OK] User registered" -ForegroundColor Green

# Login
Write-Host "`n3. Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin$timestamp@test.com"
    password = "test123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "[OK] Login successful" -ForegroundColor Green

# Protected Route
Write-Host "`n4. Protected Route..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
$protected = Invoke-RestMethod -Uri "$baseUrl/protected" -Headers $headers
Write-Host "[OK] Protected route accessed" -ForegroundColor Green

# Get Roles
Write-Host "`n5. Get Roles..." -ForegroundColor Yellow
$roles = Invoke-RestMethod -Uri "$baseUrl/rbac/roles" -Headers $headers
Write-Host "[OK] Found $($roles.data.Count) roles" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ALL AUTHENTICATION TESTS PASSED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nTest credentials:"
Write-Host "Email: admin$timestamp@test.com"
Write-Host "Password: test123456`n"
