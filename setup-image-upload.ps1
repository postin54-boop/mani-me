# Product Image Upload - Quick Setup

Write-Host "🖼️  Setting up Product Image Upload System..." -ForegroundColor Cyan
Write-Host ""

# Navigate to backend
Set-Location "c:\Users\PC\Desktop\mani-me\mani-me-backend"

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
npm install multer firebase-admin --save

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Product Image Upload System is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. (Optional) Enable Firebase Storage in Firebase Console" -ForegroundColor White
Write-Host "   - Go to https://console.firebase.google.com" -ForegroundColor Gray
Write-Host "   - Navigate to Storage and click 'Get Started'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the backend server:" -ForegroundColor White
Write-Host "   cd mani-me-backend && npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the admin dashboard:" -ForegroundColor White
Write-Host "   cd mani-me-admin && npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Navigate to Grocery Shop or Packaging Shop" -ForegroundColor White
Write-Host "   - Click 'Add New Item' or edit existing item" -ForegroundColor Gray
Write-Host "   - Use the new Image Upload component:" -ForegroundColor Gray
Write-Host "     • Drag & drop image files" -ForegroundColor Gray
Write-Host "     • Click 'Choose File' to select image" -ForegroundColor Gray
Write-Host "     • Click 'Paste Image URL' for manual URL input" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For detailed documentation, see:" -ForegroundColor Cyan
Write-Host "   PRODUCT_IMAGE_UPLOAD_GUIDE.md" -ForegroundColor Gray
Write-Host ""
