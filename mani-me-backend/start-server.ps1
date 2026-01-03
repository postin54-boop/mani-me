Set-Location "C:\Users\PC\Desktop\mani-me\mani-me-backend"
Write-Host "Starting Mani Me Backend Server..." -ForegroundColor Green
Write-Host "Server will be accessible at http://192.168.1.181:4000" -ForegroundColor Cyan
node src/index.js
