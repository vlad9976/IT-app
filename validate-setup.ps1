# =====================================================
# Auto-Update Setup Validator
# =====================================================
# Checks if everything is configured correctly
# =====================================================

Write-Host ""
Write-Host "=== Auto-Update Setup Validator ===" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check 1: package.json exists
Write-Host "[1/8] Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
    Write-Host "  ✅ Found" -ForegroundColor Green
    Write-Host "      Version: $($pkg.version)" -ForegroundColor Gray
    
    # Check publish config
    if ($pkg.build.publish -and $pkg.build.publish[0].provider -eq "github") {
        Write-Host "  ✅ GitHub publish configured" -ForegroundColor Green
        
        $owner = $pkg.build.publish[0].owner
        $repo = $pkg.build.publish[0].repo
        
        if ($owner -eq "YOUR_GITHUB_USERNAME" -or $repo -eq "YOUR_REPO_NAME") {
            Write-Host "  ⚠ WARNING: GitHub owner/repo not configured" -ForegroundColor Yellow
            Write-Host "      Run: .\setup-github-updates.ps1" -ForegroundColor DarkYellow
            $allGood = $false
        } else {
            Write-Host "      Owner: $owner" -ForegroundColor Gray
            Write-Host "      Repo: $repo" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ GitHub publish not configured" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "  ❌ Not found" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Check 2: electron-updater dependency
Write-Host "[2/8] Checking electron-updater..." -ForegroundColor Yellow
if ($pkg.dependencies.'electron-updater') {
    Write-Host "  ✅ Dependency configured: $($pkg.dependencies.'electron-updater')" -ForegroundColor Green
} else {
    Write-Host "  ❌ Missing dependency" -ForegroundColor Red
    Write-Host "      Run: npm install electron-updater" -ForegroundColor DarkYellow
    $allGood = $false
}

Write-Host ""

# Check 3: electron-log dependency
Write-Host "[3/8] Checking electron-log..." -ForegroundColor Yellow
if ($pkg.dependencies.'electron-log') {
    Write-Host "  ✅ Dependency configured: $($pkg.dependencies.'electron-log')" -ForegroundColor Green
} else {
    Write-Host "  ❌ Missing dependency" -ForegroundColor Red
    Write-Host "      Run: npm install electron-log" -ForegroundColor DarkYellow
    $allGood = $false
}

Write-Host ""

# Check 4: node_modules installed
Write-Host "[4/8] Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    if (Test-Path "node_modules\electron-updater") {
        Write-Host "  ✅ electron-updater installed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ electron-updater not installed" -ForegroundColor Yellow
        Write-Host "      Run: npm install" -ForegroundColor DarkYellow
        $allGood = $false
    }
    
    if (Test-Path "node_modules\electron-log") {
        Write-Host "  ✅ electron-log installed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ electron-log not installed" -ForegroundColor Yellow
        Write-Host "      Run: npm install" -ForegroundColor DarkYellow
        $allGood = $false
    }
} else {
    Write-Host "  ❌ node_modules not found" -ForegroundColor Red
    Write-Host "      Run: npm install" -ForegroundColor DarkYellow
    $allGood = $false
}

Write-Host ""

# Check 5: GH_TOKEN environment variable
Write-Host "[5/8] Checking GH_TOKEN..." -ForegroundColor Yellow
$token = [System.Environment]::GetEnvironmentVariable('GH_TOKEN', 'User')
if ($token) {
    if ($token -match '^ghp_[a-zA-Z0-9]{36}$') {
        Write-Host "  ✅ GH_TOKEN is set (User level)" -ForegroundColor Green
        Write-Host "      Token: $($token.Substring(0, 10))..." -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ GH_TOKEN format looks incorrect" -ForegroundColor Yellow
        Write-Host "      Should start with 'ghp_'" -ForegroundColor DarkYellow
    }
} else {
    $token = $env:GH_TOKEN
    if ($token) {
        Write-Host "  ⚠ GH_TOKEN set for session only" -ForegroundColor Yellow
        Write-Host "      Set permanently: [System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_...', 'User')" -ForegroundColor DarkYellow
    } else {
        Write-Host "  ❌ GH_TOKEN not set" -ForegroundColor Red
        Write-Host "      Run: .\setup-github-updates.ps1" -ForegroundColor DarkYellow
        $allGood = $false
    }
}

Write-Host ""

# Check 6: main.js has auto-updater
Write-Host "[6/8] Checking electron/main.js..." -ForegroundColor Yellow
if (Test-Path "electron\main.js") {
    $mainContent = Get-Content "electron\main.js" -Raw
    if ($mainContent -match "electron-updater" -and $mainContent -match "autoUpdater") {
        Write-Host "  ✅ Auto-updater code present" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Auto-updater code missing" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "  ❌ electron/main.js not found" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Check 7: UpdateNotification component
Write-Host "[7/8] Checking UpdateNotification component..." -ForegroundColor Yellow
if (Test-Path "src\components\UpdateNotification.jsx") {
    Write-Host "  ✅ Component exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Component not found (optional)" -ForegroundColor Yellow
}

Write-Host ""

# Check 8: Documentation
Write-Host "[8/8] Checking documentation..." -ForegroundColor Yellow
$docs = @(
    "AUTO_UPDATE_GUIDE.md",
    "BUILD_AND_PUBLISH.md",
    "QUICK_REFERENCE.md"
)

$docsFound = 0
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        $docsFound++
    }
}

if ($docsFound -eq $docs.Count) {
    Write-Host "  ✅ All documentation files present" -ForegroundColor Green
} else {
    Write-Host "  ⚠ $docsFound/$($docs.Count) documentation files found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Final verdict
if ($allGood) {
    Write-Host "✅ SETUP COMPLETE - Ready to publish!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Commit your changes:" -ForegroundColor Gray
    Write-Host "       git add ." -ForegroundColor DarkGray
    Write-Host "       git commit -m 'Add auto-update support'" -ForegroundColor DarkGray
    Write-Host "       git tag v$($pkg.version)" -ForegroundColor DarkGray
    Write-Host "       git push origin main" -ForegroundColor DarkGray
    Write-Host "       git push origin v$($pkg.version)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  2. Publish to GitHub:" -ForegroundColor Gray
    Write-Host "       npm run publish" -ForegroundColor DarkGray
    Write-Host ""
} else {
    Write-Host "⚠ SETUP INCOMPLETE - Fix issues above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick fix:" -ForegroundColor Cyan
    Write-Host "  Run: .\setup-github-updates.ps1" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "📖 For detailed help, read: AUTO_UPDATE_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
