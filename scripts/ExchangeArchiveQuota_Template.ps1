# ================================================================
# EXCHANGE ONLINE - MAILBOX ARCHIVE QUOTA
# 1) Connect-ExchangeOnline
# 2) Check current archive quota
# 3) Enable AutoExpandingArchive
# ================================================================

$Mailbox = '{{mailbox}}'.Trim()
$DoConnect = ('{{ConnectExchange}}' -eq 'true')
$DoCheck   = ('{{CheckQuota}}' -eq 'true')
$DoExtend  = ('{{EnableAutoExpand}}' -eq 'true')

if (-not $Mailbox -or $Mailbox -match '^\{\{') {
    Write-Host ""
    Write-Host "Enter a mailbox UPN (user@domain.com) and generate the script again." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

function Connect-ExoIfNeeded {
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
}

function Show-ArchiveQuota {
    param([string]$Identity)

    Get-Mailbox -Identity $Identity |
        Format-List DisplayName, PrimarySmtpAddress, ArchiveStatus, ArchiveQuota, ArchiveWarningQuota, AutoExpandingArchiveEnabled
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " MAILBOX ARCHIVE QUOTA" -ForegroundColor Cyan
Write-Host " Mailbox: $Mailbox" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

if ($DoConnect) {
    Write-Host "[1] CONNECT TO EXCHANGE ONLINE" -ForegroundColor Yellow
    Write-Host "===================================================="
    Connect-ExoIfNeeded
    Write-Host ""
}

if ($DoCheck) {
    Write-Host "[2] CURRENT ARCHIVE QUOTA" -ForegroundColor Yellow
    Write-Host "===================================================="
    Show-ArchiveQuota -Identity $Mailbox
    Write-Host ""
}

if ($DoExtend) {
    Write-Host "[3] ENABLE AUTO-EXPANDING ARCHIVE" -ForegroundColor Yellow
    Write-Host "===================================================="

    $mbx = Get-Mailbox -Identity $Mailbox -ErrorAction Stop

    if ($mbx.ArchiveStatus -ne 'Active') {
        Write-Host "Archive is not active. Enabling archive mailbox first..." -ForegroundColor Yellow
        Enable-Mailbox -Identity $Mailbox -Archive | Out-Null
        Write-Host "[OK] Archive mailbox enabled." -ForegroundColor Green
        $mbx = Get-Mailbox -Identity $Mailbox
    }

    if ($mbx.AutoExpandingArchiveEnabled) {
        Write-Host "Auto-expanding archive is already enabled." -ForegroundColor Green
    }
    else {
        Enable-Mailbox -Identity $Mailbox -AutoExpandingArchive
        Write-Host "[OK] Auto-expanding archive enabled." -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Quota after change:" -ForegroundColor Yellow
    Show-ArchiveQuota -Identity $Mailbox
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " DONE" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
