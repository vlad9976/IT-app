# ==========================================================
# UNJOIN OLD DOMAIN
# Local admin + stop user processes + unjoin
# Works in plain PowerShell (run as Admin) or as SYSTEM
# ==========================================================

param(
    [string]$OldDomainUser = "{{OldDomainUser}}",
    [string]$OldDomainPass = "{{OldDomainPass}}"
)

Write-Host "=== Pre-Unjoin Domain Started ==="

# GUARDRAILS - MUST RUN AS ADMIN OR SYSTEM
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$isSystem = ($identity.User.Value -eq 'S-1-5-18')

if (-not $isAdmin -and -not $isSystem) {
    Write-Error "Run as Administrator or SYSTEM. Current user: $($identity.Name)"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($OldDomainUser)) {
    Write-Error "Old domain admin username is required (e.g. OLDDOMAIN\\admin)"
    exit 1
}
if ([string]::IsNullOrWhiteSpace($OldDomainPass)) {
    Write-Error "Old domain admin password is required"
    exit 1
}

# STOP USER-DEPENDENT PROCESSES
Write-Host "Stopping user-dependent processes..."
$Processes = @(
    "OneDrive.exe",
    "ms-teams.exe",
    "Teams.exe",
    "msedge.exe",
    "chrome.exe"
)
foreach ($p in $Processes) {
    taskkill /f /im $p 2>$null
}
Write-Host "Processes stopped."

# BUILD CREDENTIAL AND UNJOIN
Write-Host "Unjoining from old domain..."
$SecurePass = ConvertTo-SecureString $OldDomainPass -AsPlainText -Force
$OldDomainCred = New-Object System.Management.Automation.PSCredential($OldDomainUser, $SecurePass)

Remove-Computer -UnjoinDomainCredential $OldDomainCred -Force -Restart
