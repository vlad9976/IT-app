# First Release Publisher
# This script helps you publish your first release to GitHub

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   IT Script Generator - First Release" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if GH_TOKEN is set
if (-not $env:GH_TOKEN) {
    Write-Host "ERROR: GH_TOKEN not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to set your GitHub token first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Create token at: https://github.com/settings/tokens" -ForegroundColor Gray
    Write-Host "   - Click 'Generate new token (classic)'" -ForegroundColor Gray
    Write-Host "   - Select 'repo' and 'write:packages' scopes" -ForegroundColor Gray
    Write-Host "   - Copy the token" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Set it permanently:" -ForegroundColor Gray
    Write-Host "   [System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'your_token', 'User')" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "3. Restart PowerShell and run this script again" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "SUCCESS: GH_TOKEN found" -ForegroundColor Green
Write-Host ""

# Check git status
Write-Host "Checking git status..." -ForegroundColor Cyan
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "WARNING: You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host ""
    git status --short
    Write-Host ""
    $commit = Read-Host "Commit these changes? (y/n)"
    if ($commit -eq 'y') {
        $message = Read-Host "Commit message (or press Enter for default)"
        if (-not $message) {
            $message = "Prepare for first release"
        }
        git add .
        git commit -m $message
        Write-Host "SUCCESS: Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "SUCCESS: Working tree clean" -ForegroundColor Green
}
Write-Host ""

# Check current version
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "Current version: v$currentVersion" -ForegroundColor Cyan
Write-Host ""

# Ask for version confirmation
$newVersion = Read-Host "Enter version for first release (press Enter for v$currentVersion)"
if (-not $newVersion) {
    $newVersion = $currentVersion
}

# Ensure version starts with 'v'
if (-not $newVersion.StartsWith('v')) {
    $newVersion = "v$newVersion"
}

Write-Host ""
Write-Host "Creating git tag: $newVersion" -ForegroundColor Cyan

# Check if tag exists
$tagExists = git tag -l $newVersion
if ($tagExists) {
    Write-Host "WARNING: Tag $newVersion already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Delete and recreate? (y/n)"
    if ($overwrite -eq 'y') {
        git tag -d $newVersion
        git push origin :refs/tags/$newVersion 2>$null
        Write-Host "SUCCESS: Old tag deleted" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Aborted" -ForegroundColor Red
        exit 1
    }
}

# Create tag
git tag $newVersion
Write-Host "SUCCESS: Tag created locally" -ForegroundColor Green
Write-Host ""

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main
git push origin $newVersion
Write-Host "SUCCESS: Pushed to GitHub" -ForegroundColor Green
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
    Write-Host "Your app is published!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Release: https://github.com/vlad9976/IT-app/releases/tag/$newVersion" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Share this with your team:" -ForegroundColor Yellow
    Write-Host "https://github.com/vlad9976/IT-app/releases/latest" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to the release URL above" -ForegroundColor Gray
    Write-Host "2. Verify the .exe file is there" -ForegroundColor Gray
    Write-Host "3. Download and test it yourself" -ForegroundColor Gray
    Write-Host "4. Share with your team!" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Check GH_TOKEN is correct" -ForegroundColor Gray
    Write-Host "2. Verify you have write access to the repo" -ForegroundColor Gray
    Write-Host "3. Check internet connection" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try again:" -ForegroundColor Yellow
    Write-Host "npm run publish" -ForegroundColor Gray
    Write-Host ""
}
