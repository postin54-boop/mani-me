# Mani Me Backend - Firewall Setup
# Run this script as Administrator to allow Node.js server through Windows Firewall

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Mani Me Backend - Firewall Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Remove existing rule if it exists
$existingRule = Get-NetFirewallRule -DisplayName "Mani Me Backend" -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "Removing existing firewall rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Mani Me Backend"
}

# Add new firewall rule
Write-Host "Adding firewall rule for port 4000..." -ForegroundColor Cyan
try {
    New-NetFirewallRule -DisplayName "Mani Me Backend" `
                        -Direction Inbound `
                        -Protocol TCP `
                        -LocalPort 4000 `
                        -Action Allow `
                        -Profile Any `
                        -Description "Allow incoming connections to Mani Me backend server on port 4000" | Out-Null
    
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add firewall rule: $_" -ForegroundColor Red
    pause
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server Information:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get network IP
$networkIP = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1

Write-Host "Local IP: $($networkIP.IPAddress)" -ForegroundColor Green
Write-Host "Port: 4000" -ForegroundColor Green
Write-Host ""
Write-Host "Server URL: http://$($networkIP.IPAddress):4000" -ForegroundColor Yellow
Write-Host ""
Write-Host "You can now connect to the server from your mobile device!" -ForegroundColor Green
Write-Host ""
pause
