# User Token Setup for Private Repo Updates
# This script helps users set up their GitHub token for auto-updates

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   GitHub Token Setup for Updates" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This app needs a GitHub token to check for updates" -ForegroundColor Yellow
Write-Host "from the private repository." -ForegroundColor Yellow
Write-Host ""

# Token file path
$tokenPath = "$env:USERPROFILE\.github-update-token"

Write-Host "STEP 1: Create a GitHub Personal Access Token" -ForegroundColor Cyan
Write-Host "----------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "1. Go to: https://github.com/settings/tokens/new" -ForegroundColor White
Write-Host "2. Note: IT App Updates (Read-Only)" -ForegroundColor Gray
Write-Host "3. Expiration: 90 days (or your preference)" -ForegroundColor Gray
Write-Host "4. Select ONLY this scope:" -ForegroundColor Gray
Write-Host "   - repo (read-only access)" -ForegroundColor Yellow
Write-Host "5. Click 'Generate token'" -ForegroundColor Gray
Write-Host "6. Copy the token (starts with ghp_...)" -ForegroundColor Gray
Write-Host ""

$openBrowser = Read-Host "Open GitHub token page now? (y/n)"
if ($openBrowser -eq 'y') {
    Start-Process "https://github.com/settings/tokens/new"
    Write-Host ""
    Write-Host "Waiting for you to create the token..." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "STEP 2: Enter Your Token" -ForegroundColor Cyan
Write-Host "----------------------------------------------" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Paste your GitHub token here (it will be hidden)"

if (-not $token) {
    Write-Host ""
    Write-Host "ERROR: No token provided!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Validate token format
if (-not $token.StartsWith('ghp_') -and -not $token.StartsWith('github_pat_')) {
    Write-Host ""
    Write-Host "WARNING: Token doesn't look like a GitHub token" -ForegroundColor Yellow
    Write-Host "GitHub tokens usually start with 'ghp_' or 'github_pat_'" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

# Save token to file
try {
    $token | Out-File -FilePath $tokenPath -Encoding UTF8 -NoNewline
    Write-Host ""
    Write-Host "SUCCESS: Token saved!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Token location: $tokenPath" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to save token!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "STEP 3: Test the Token" -ForegroundColor Cyan
Write-Host "----------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Testing access to GitHub repository..." -ForegroundColor Yellow

# Test token by trying to access the repo
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/vlad9976/IT-app" -Headers $headers -ErrorAction Stop
    Write-Host ""
    Write-Host "SUCCESS: Token works!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository: $($response.full_name)" -ForegroundColor Gray
    Write-Host "Private: $($response.private)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "ERROR: Token test failed!" -ForegroundColor Red
    Write-Host ""
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "1. Token doesn't have 'repo' scope" -ForegroundColor Gray
        Write-Host "2. You don't have access to vlad9976/IT-app" -ForegroundColor Gray
        Write-Host "3. Repository name is incorrect" -ForegroundColor Gray
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "Token was saved, but may not work for updates." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The IT Script Generator app can now check for updates" -ForegroundColor White
Write-Host "from the private GitHub repository." -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Launch the IT Script Generator app" -ForegroundColor Gray
Write-Host "2. Updates will be checked automatically" -ForegroundColor Gray
Write-Host "3. You'll be notified when updates are available" -ForegroundColor Gray
Write-Host ""
Write-Host "Token location: $tokenPath" -ForegroundColor DarkGray
Write-Host ""
