# ==========================================================
# JOIN NEW DOMAIN
# Works in plain PowerShell (run as Admin) or as SYSTEM
# All values from script parameters - no Ninja/env vars required
# ==========================================================

param(
    [string]$DomainFQDN = "{{DomainFQDN}}",
    [string]$DomainJoinUser = "{{DomainJoinUser}}",
    [string]$DomainJoinPassword = "{{DomainJoinPassword}}",
    [string]$DnsServer = "{{DnsServer}}"
)

Write-Host "=== Domain Join Process Started ==="

# GUARDRAILS - MUST RUN AS ADMIN (or SYSTEM)
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$isSystem = ($identity.User.Value -eq 'S-1-5-18')

if (-not $isAdmin -and -not $isSystem) {
    Write-Error "Run as Administrator or SYSTEM. Current user: $($identity.Name)"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($DomainFQDN)) {
    Write-Error "Domain FQDN is required (e.g. contoso.com)"
    exit 1
}
if ([string]::IsNullOrWhiteSpace($DomainJoinUser)) {
    Write-Error "Domain join user is required (e.g. DOMAIN\joiner or joiner@domain.com)"
    exit 1
}
if ([string]::IsNullOrWhiteSpace($DomainJoinPassword)) {
    Write-Error "Domain join password is required"
    exit 1
}
if ([string]::IsNullOrWhiteSpace($DnsServer)) {
    Write-Error "DNS server (DC IP/hostname) is required"
    exit 1
}

# SET DNS TO NEW DC
Write-Host "Setting DNS to $DnsServer"
$adapter = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object -First 1

if (-not $adapter) {
    Write-Error "No active network adapter found"
    exit 1
}

Set-DnsClientServerAddress -InterfaceIndex $adapter.ifIndex -ServerAddresses $DnsServer
ipconfig /flushdns | Out-Null

# DNS CHECK
try {
    Resolve-DnsName $DomainFQDN -ErrorAction Stop | Out-Null
}
catch {
    Write-Error "DNS resolution failed for $DomainFQDN. Check DNS server and network."
    exit 1
}

Write-Host "Joining domain $DomainFQDN using $DomainJoinUser"

$SecurePass = ConvertTo-SecureString $DomainJoinPassword -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential($DomainJoinUser, $SecurePass)

Add-Computer -DomainName $DomainFQDN -Credential $Cred -Force -Restart
