# ================================================================
# CONNECT TO EXCHANGE ONLINE
# ================================================================

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " CONNECT TO EXCHANGE ONLINE" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Module -ListAvailable -Name ExchangeOnlineManagement)) {
    Write-Host "Installing ExchangeOnlineManagement module..." -ForegroundColor Yellow
    Install-Module ExchangeOnlineManagement -Scope CurrentUser -Force
}

Import-Module ExchangeOnlineManagement

try {
    Get-OrganizationConfig -ErrorAction Stop | Out-Null
    Write-Host "Already connected to Exchange Online." -ForegroundColor Green
}
catch {
    Write-Host "Sign in when the browser / device prompt appears." -ForegroundColor Yellow
    Connect-ExchangeOnline
}

Write-Host ""
Write-Host "[OK] Connected to Exchange Online." -ForegroundColor Green
Write-Host ""
