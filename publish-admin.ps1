# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script needs to run as Administrator to create symbolic links." -ForegroundColor Yellow
    Write-Host "Restarting as Administrator..." -ForegroundColor Cyan
    Write-Host ""
    
    # Restart as admin
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\publish-first-release.ps1"
    exit
}

Write-Host "Running as Administrator" -ForegroundColor Green
Write-Host ""

# Run the publish script
& ".\publish-first-release.ps1"
