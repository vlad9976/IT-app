# Republish with Token Authentication
# This rebuilds the app with private repo token support

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Republish with Token Auth" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check GH_TOKEN
if (-not $env:GH_TOKEN) {
    Write-Host "ERROR: GH_TOKEN not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set it first:" -ForegroundColor Yellow
    Write-Host '$env:GH_TOKEN = "your_token_here"' -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "SUCCESS: GH_TOKEN found" -ForegroundColor Green
Write-Host ""

# Increment version
Write-Host "Updating version to 1.0.3..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.version = "1.0.3"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "SUCCESS: Version updated to 1.0.3" -ForegroundColor Green
Write-Host ""

# Create tag
Write-Host "Creating git tag v1.0.3..." -ForegroundColor Cyan
git add package.json electron/main.js
git commit -m "Add token authentication for private repo updates"
git tag v1.0.3
git push origin main
git push origin v1.0.3
Write-Host "SUCCESS: Tag pushed" -ForegroundColor Green
Write-Host ""

# Build and publish
Write-Host "Building and publishing..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

npm run publish

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "App published with token authentication!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Release: https://github.com/vlad9976/IT-app/releases/tag/v1.0.3" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: Your team needs to set up tokens!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Share these files with your team:" -ForegroundColor Cyan
    Write-Host "1. IT-Script-Generator-Setup-1.0.3.exe (from GitHub release)" -ForegroundColor Gray
    Write-Host "2. setup-user-token.ps1 (from this folder)" -ForegroundColor Gray
    Write-Host "3. PRIVATE_REPO_SETUP.md (instructions)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Each team member must:" -ForegroundColor Yellow
    Write-Host "1. Install the app" -ForegroundColor Gray
    Write-Host "2. Run: setup-user-token.ps1" -ForegroundColor Gray
    Write-Host "3. Create their own GitHub token (read-only)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Write-Host ""
}
