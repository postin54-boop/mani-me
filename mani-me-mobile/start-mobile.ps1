# Start Mani Me Mobile App
Write-Host "Starting Mani Me Mobile App..." -ForegroundColor Green
Set-Location $PSScriptRoot
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start Expo
Write-Host "Starting Expo dev server..." -ForegroundColor Green
npx expo start
