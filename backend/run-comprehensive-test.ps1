# ═══════════════════════════════════════════════════════════════════════════
# 🧪 Comprehensive ERP System Test - Quick Start Script
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                           ║" -ForegroundColor Cyan
Write-Host "║          🧪 COMPREHENSIVE ERP SYSTEM TEST SUITE 🧪                        ║" -ForegroundColor Cyan
Write-Host "║                                                                           ║" -ForegroundColor Cyan
Write-Host "║     Testing ALL Modules, ALL User Types, ALL Functionality               ║" -ForegroundColor Cyan
Write-Host "║                                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (!(Test-Path "COMPREHENSIVE_ERP_SYSTEM_TEST.js")) {
    Write-Host "❌ Error: COMPREHENSIVE_ERP_SYSTEM_TEST.js not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the backend directory." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if Node.js is installed
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "   Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "   Please ensure you're in the correct directory." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Failed to install dependencies!" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    # Check if axios and form-data are installed
    Write-Host "🔍 Checking test dependencies..." -ForegroundColor Yellow
    
    $hasAxios = Test-Path "node_modules/axios"
    $hasFormData = Test-Path "node_modules/form-data"
    
    if (!$hasAxios -or !$hasFormData) {
        Write-Host "📦 Installing missing test dependencies..." -ForegroundColor Yellow
        npm install axios form-data
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error: Failed to install test dependencies!" -ForegroundColor Red
            Write-Host ""
            exit 1
        }
        Write-Host "✅ Test dependencies installed!" -ForegroundColor Green
    } else {
        Write-Host "✅ Test dependencies found!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Ask user to confirm backend is running
Write-Host "⚠️  IMPORTANT: Make sure your backend server is running!" -ForegroundColor Yellow
Write-Host "   Expected URL: http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Is your backend server running? (Y/N)"

if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host ""
    Write-Host "❌ Test cancelled. Please start your backend server first:" -ForegroundColor Red
    Write-Host "   npm run dev" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting comprehensive test suite..." -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Run the test
node COMPREHENSIVE_ERP_SYSTEM_TEST.js

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ Test suite completed successfully!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "⚠️  Test suite completed with errors. Please review the output above." -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
}

# Pause to let user review results
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
