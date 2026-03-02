# =====================================================
# GitHub Auto-Update Setup Script
# =====================================================
# This script helps you configure GitHub auto-updates
# for the IT Script Generator application
# =====================================================

Write-Host ""
Write-Host "=== IT Script Generator - GitHub Auto-Update Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found. Run this script from the project root." -ForegroundColor Red
    exit 1
}

# Read current package.json
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

Write-Host "Current Configuration:" -ForegroundColor Yellow
Write-Host "  App Name: $($packageJson.name)" -ForegroundColor Gray
Write-Host "  Version: $($packageJson.version)" -ForegroundColor Gray
Write-Host ""

# Step 1: GitHub Repository
Write-Host "[Step 1/3] GitHub Repository Configuration" -ForegroundColor Cyan
Write-Host ""

$currentOwner = $packageJson.build.publish[0].owner
$currentRepo = $packageJson.build.publish[0].repo

if ($currentOwner -eq "YOUR_GITHUB_USERNAME" -or $currentRepo -eq "YOUR_REPO_NAME") {
    Write-Host "  Current settings need to be updated:" -ForegroundColor Yellow
    Write-Host "    Owner: $currentOwner" -ForegroundColor Gray
    Write-Host "    Repo: $currentRepo" -ForegroundColor Gray
    Write-Host ""
    
    $owner = Read-Host "  Enter your GitHub username"
    $repo = Read-Host "  Enter your repository name"
    
    # Update package.json
    $packageJson.build.publish[0].owner = $owner
    $packageJson.build.publish[0].repo = $repo
    
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    
    Write-Host "  ✅ package.json updated" -ForegroundColor Green
} else {
    Write-Host "  ✅ Already configured:" -ForegroundColor Green
    Write-Host "    Owner: $currentOwner" -ForegroundColor Gray
    Write-Host "    Repo: $currentRepo" -ForegroundColor Gray
}

Write-Host ""

# Step 2: GitHub Token
Write-Host "[Step 2/3] GitHub Personal Access Token" -ForegroundColor Cyan
Write-Host ""

$existingToken = [System.Environment]::GetEnvironmentVariable('GH_TOKEN', 'User')

if ($existingToken) {
    Write-Host "  ✅ GH_TOKEN is already set (User level)" -ForegroundColor Green
    Write-Host "    Token: $($existingToken.Substring(0, 10))..." -ForegroundColor Gray
    Write-Host ""
    $updateToken = Read-Host "  Update token? (y/N)"
    
    if ($updateToken -match '^y(es)?$') {
        $existingToken = $null
    }
}

if (-not $existingToken) {
    Write-Host "  You need a GitHub Personal Access Token with 'repo' scope" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  How to create one:" -ForegroundColor Cyan
    Write-Host "    1. Go to: https://github.com/settings/tokens" -ForegroundColor Gray
    Write-Host "    2. Click 'Generate new token (classic)'" -ForegroundColor Gray
    Write-Host "    3. Name: IT-Toolkit-Publisher" -ForegroundColor Gray
    Write-Host "    4. Select scope: ✅ repo" -ForegroundColor Gray
    Write-Host "    5. Generate and copy the token" -ForegroundColor Gray
    Write-Host ""
    
    $token = Read-Host "  Paste your GitHub token (ghp_...)" -AsSecureString
    $tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
    )
    
    if ($tokenPlain -match '^ghp_[a-zA-Z0-9]{36}$') {
        # Set as User environment variable (permanent)
        [System.Environment]::SetEnvironmentVariable('GH_TOKEN', $tokenPlain, 'User')
        
        # Also set for current session
        $env:GH_TOKEN = $tokenPlain
        
        Write-Host "  ✅ GH_TOKEN saved (User environment variable)" -ForegroundColor Green
        Write-Host "  ⚠ You may need to restart your terminal/IDE" -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ Invalid token format. Should start with 'ghp_'" -ForegroundColor Red
        Write-Host "  Run this script again with a valid token." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Step 3: Dependencies
Write-Host "[Step 3/3] Install Dependencies" -ForegroundColor Cyan
Write-Host ""

$nodeModules = Test-Path "node_modules"
if (-not $nodeModules) {
    Write-Host "  Installing npm packages..." -ForegroundColor Yellow
    npm install
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✅ node_modules already exists" -ForegroundColor Green
    $reinstall = Read-Host "  Reinstall dependencies? (y/N)"
    if ($reinstall -match '^y(es)?$') {
        npm install
        Write-Host "  ✅ Dependencies reinstalled" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Commit your changes:" -ForegroundColor Gray
Write-Host "       git add ." -ForegroundColor DarkGray
Write-Host "       git commit -m 'Release v$($packageJson.version)'" -ForegroundColor DarkGray
Write-Host "       git tag v$($packageJson.version)" -ForegroundColor DarkGray
Write-Host "       git push origin main" -ForegroundColor DarkGray
Write-Host "       git push origin v$($packageJson.version)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. Build and publish:" -ForegroundColor Gray
Write-Host "       npm run publish" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3. Download installer from GitHub Releases" -ForegroundColor Gray
Write-Host "       https://github.com/$($packageJson.build.publish[0].owner)/$($packageJson.build.publish[0].repo)/releases" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📖 For detailed instructions, see: AUTO_UPDATE_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
