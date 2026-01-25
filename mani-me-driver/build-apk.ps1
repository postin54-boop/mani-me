# Build APK for Mani Me Driver
Set-Location $PSScriptRoot
Write-Host "Current directory: $(Get-Location)"
Write-Host "Starting EAS build..."

# Run the build
eas build -p android --profile preview

Write-Host "Build command completed."
