# ==========================================================
# DOMAIN MIGRATION – SMART BACKUP + ONEDRIVE VALIDATION + BREAKGLASS
# ==========================================================

param(
    [string]$Destination = "{{Destination}}",
    [string]$BackupDesktop = "{{BackupDesktop}}",
    [string]$BackupDocuments = "{{BackupDocuments}}",
    [string]$BackupPictures = "{{BackupPictures}}",
    [string]$BackupDownloads = "{{BackupDownloads}}",
    [string]$BackupFavorites = "{{BackupFavorites}}",
    [string]$BackupMusic = "{{BackupMusic}}",
    [string]$BackupVideos = "{{BackupVideos}}",
    [string]$BackupLinks = "{{BackupLinks}}",
    [string]$BackupSavedGames = "{{BackupSavedGames}}",
    [string]$BackupContacts = "{{BackupContacts}}",
    [string]$BackupSearches = "{{BackupSearches}}",
    [string]$Backup3DObjects = "{{Backup3DObjects}}",
    [string]$BackupOneDrive = "{{BackupOneDrive}}",
    [string]$BackupOutlook = "{{BackupOutlook}}",
    [string]$BackupChrome = "{{BackupChrome}}",
    [string]$BackupEdge = "{{BackupEdge}}",
    [string]$BackupFirefox = "{{BackupFirefox}}",
    [string]$BackupPrinters = "{{BackupPrinters}}"
)

Write-Host "=== DOMAIN MIGRATION SMART BACKUP STARTED ==="

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Error "Run this script as Administrator."
    exit 1
}

# CREATE / VERIFY BREAKGLASS
$BreakGlassUserName   = "IT-BreakGlass"
$BreakGlassPlainPass  = "S0mething!VeryStr0ng#2026"
$BreakGlassSecurePass = ConvertTo-SecureString $BreakGlassPlainPass -AsPlainText -Force

try {
    $ExistingLocalUser = Get-LocalUser -Name $BreakGlassUserName -ErrorAction SilentlyContinue
    if (-not $ExistingLocalUser) {
        New-LocalUser -Name $BreakGlassUserName -Password $BreakGlassSecurePass -FullName "IT Emergency Admin" -Description "Local emergency admin" -PasswordNeverExpires:$true -UserMayNotChangePassword:$true -AccountNeverExpires:$true | Out-Null
    }
    elseif ($ExistingLocalUser.Enabled -eq $false) { Enable-LocalUser -Name $BreakGlassUserName }
    $IsBreakGlassAdmin = Get-LocalGroupMember -Group "Administrators" -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*\$BreakGlassUserName" -or $_.Name -eq $BreakGlassUserName }
    if (-not $IsBreakGlassAdmin) { Add-LocalGroupMember -Group "Administrators" -Member $BreakGlassUserName }
} catch { Write-Error "Failed BreakGlass: $($_.Exception.Message)"; exit 1 }

# FUNCTIONS
function Test-ValidUserProfile { param([string]$Path)
    if (-not (Test-Path $Path)) { return $false }
    $Leaf = Split-Path $Path -Leaf
    $Excluded = @('Public','Default','Default User','All Users','Administrator','WDAGUtilityAccount')
    if ($Leaf -in $Excluded -or $Leaf -match '^TEMP\.') { return $false }
    return (Test-Path (Join-Path $Path 'NTUSER.DAT'))
}

function Get-TargetUserProfile {
    $CandidatePaths = [System.Collections.Generic.List[string]]::new()
    try { $LastUser = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\LogonUI" -ErrorAction Stop).LastLoggedOnUser } catch { $LastUser = $null }
    if ($LastUser) {
        $UserPart = ($LastUser -split "\\")[-1]; if ($UserPart.StartsWith(".\")) { $UserPart = $UserPart.Substring(2) }
        if ($UserPart) { $CandidatePaths.Add("C:\Users\$UserPart") }
    }
    try {
        foreach ($p in Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList' -ErrorAction SilentlyContinue) {
            $pi = Get-ItemProperty $p.PSPath -ErrorAction SilentlyContinue
            if ($pi.ProfileImagePath -like 'C:\Users\*') {
                $exp = [Environment]::ExpandEnvironmentVariables($pi.ProfileImagePath)
                $CandidatePaths.Add($exp)
            }
        }
    } catch {}
    $Seen = @{}
    foreach ($Path in $CandidatePaths) {
        if ([string]::IsNullOrWhiteSpace($Path) -or $Seen[$Path.ToLower()]) { continue }
        $Seen[$Path.ToLower()] = $true
        if (Test-ValidUserProfile -Path $Path) {
            return [pscustomobject]@{ UserName = (Split-Path $Path -Leaf); ProfileDir = $Path }
        }
    }
    return $null
}

function Expand-UserPath { param([string]$PathValue, [string]$UserProfileDir = $null)
    if ([string]::IsNullOrWhiteSpace($PathValue)) { return $null }
    if ($UserProfileDir) { $PathValue = $PathValue -replace '%USERPROFILE%',$UserProfileDir -replace '\$env:USERPROFILE',$UserProfileDir }
    return [Environment]::ExpandEnvironmentVariables($PathValue)
}

function Invoke-RoboBackup { param([string]$Source, [string]$Destination)
    if (-not (Test-Path $Source)) { return }
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    & robocopy $Source $Destination /E /COPY:DAT /R:1 /W:1 /NFL /NDL /NP /XJ | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Robocopy failed: $Source -> $Destination" }
}

# DETECT PROFILE
$ProfileInfo = Get-TargetUserProfile
if (-not $ProfileInfo) { Write-Error "No valid user profile found."; exit 1 }
$User = $ProfileInfo.UserName
$ProfileDir = $ProfileInfo.ProfileDir
$BackupRoot = if ($Destination) { Join-Path $Destination.TrimEnd('\') $User } else { "C:\DomainMigration\$User" }
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

# RESOLVE SID
try { $Sid = (New-Object System.Security.Principal.NTAccount($User)).Translate([System.Security.Principal.SecurityIdentifier]).Value }
catch { Write-Error "Could not resolve SID for $User"; exit 1 }

$CurrentSid = ([Security.Principal.WindowsIdentity]::GetCurrent().User).Value
$RunningAsSystem = ($CurrentSid -eq 'S-1-5-18')
$UserShellKey = "Registry::HKEY_USERS\$Sid\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders"

if ($RunningAsSystem -or -not (Test-Path $UserShellKey)) {
    $DesktopPath = Join-Path $ProfileDir 'Desktop'
    $DocsPath = Join-Path $ProfileDir 'Documents'
    $PicturesPath = Join-Path $ProfileDir 'Pictures'
} else {
    try {
        $UShell = Get-ItemProperty $UserShellKey -ErrorAction Stop
        $DesktopPath = Expand-UserPath $UShell.Desktop -UserProfileDir $ProfileDir
        $DocsPath = Expand-UserPath $UShell.Personal -UserProfileDir $ProfileDir
        $PicturesPath = Expand-UserPath $UShell.'My Pictures' -UserProfileDir $ProfileDir
        if (-not $DesktopPath) { $DesktopPath = Join-Path $ProfileDir 'Desktop' }
        if (-not $DocsPath) { $DocsPath = Join-Path $ProfileDir 'Documents' }
        if (-not $PicturesPath) { $PicturesPath = Join-Path $ProfileDir 'Pictures' }
    } catch {
        $DesktopPath = Join-Path $ProfileDir 'Desktop'
        $DocsPath = Join-Path $ProfileDir 'Documents'
        $PicturesPath = Join-Path $ProfileDir 'Pictures'
    }
}

$DesktopInOD = $DesktopPath -like '*OneDrive*'
$DocsInOD = $DocsPath -like '*OneDrive*'
$PicturesInOD = $PicturesPath -like '*OneDrive*'

# CORE FOLDERS (Desktop, Documents, Pictures)
if ($BackupDesktop -eq 'true' -and (Test-Path $DesktopPath)) { Write-Host "Backing up Desktop..."; try { Invoke-RoboBackup -Source $DesktopPath -Destination (Join-Path $BackupRoot "Desktop") } catch { Write-Warning $_.Exception.Message } }
if ($BackupDocuments -eq 'true' -and (Test-Path $DocsPath)) { Write-Host "Backing up Documents..."; try { Invoke-RoboBackup -Source $DocsPath -Destination (Join-Path $BackupRoot "Documents") } catch { Write-Warning $_.Exception.Message } }
if ($BackupPictures -eq 'true' -and (Test-Path $PicturesPath)) { Write-Host "Backing up Pictures..."; try { Invoke-RoboBackup -Source $PicturesPath -Destination (Join-Path $BackupRoot "Pictures") } catch { Write-Warning $_.Exception.Message } }

# EXTRA FOLDERS
$ExtraMap = @{
    Downloads = $BackupDownloads
    Favorites = $BackupFavorites
    Music = $BackupMusic
    Videos = $BackupVideos
    Links = $BackupLinks
    "Saved Games" = $BackupSavedGames
    Contacts = $BackupContacts
    Searches = $BackupSearches
    "3D Objects" = $Backup3DObjects
    OneDrive = $BackupOneDrive
}
foreach ($Folder in $ExtraMap.Keys) {
    if (($ExtraMap[$Folder]) -eq 'true') {
        $Src = Join-Path $ProfileDir $Folder
        if (Test-Path $Src) {
            Write-Host "Backing up $Folder..."
            try { Invoke-RoboBackup -Source $Src -Destination (Join-Path $BackupRoot $Folder) } catch { Write-Warning $_.Exception.Message }
        }
    }
}

# OUTLOOK
if ($BackupOutlook -eq 'true') {
    $Outlook = Join-Path $ProfileDir "AppData\Roaming\Microsoft\Outlook"
    if (Test-Path $Outlook) { Write-Host "Backing up Outlook..."; try { Invoke-RoboBackup -Source $Outlook -Destination (Join-Path $BackupRoot "Outlook") } catch { Write-Warning $_.Exception.Message } }
}

# BROWSERS
if ($BackupChrome -eq 'true') {
    $Chrome = Join-Path $ProfileDir "AppData\Local\Google\Chrome\User Data"
    if (Test-Path $Chrome) { Write-Host "Backing up Chrome..."; try { Invoke-RoboBackup -Source $Chrome -Destination (Join-Path $BackupRoot "Chrome") } catch { Write-Warning $_.Exception.Message } }
}
if ($BackupEdge -eq 'true') {
    $Edge = Join-Path $ProfileDir "AppData\Local\Microsoft\Edge\User Data"
    if (Test-Path $Edge) { Write-Host "Backing up Edge..."; try { Invoke-RoboBackup -Source $Edge -Destination (Join-Path $BackupRoot "Edge") } catch { Write-Warning $_.Exception.Message } }
}
if ($BackupFirefox -eq 'true') {
    $Firefox = Join-Path $ProfileDir "AppData\Roaming\Mozilla"
    if (Test-Path $Firefox) { Write-Host "Backing up Firefox..."; try { Invoke-RoboBackup -Source $Firefox -Destination (Join-Path $BackupRoot "Firefox") } catch { Write-Warning $_.Exception.Message } }
}

# PRINTERS
if ($BackupPrinters -eq 'true') {
    $PrinterDir = Join-Path $BackupRoot "Printers"
    New-Item -ItemType Directory -Path $PrinterDir -Force | Out-Null
    try {
        Import-Module PrintManagement -ErrorAction Stop
        $Printers = Get-Printer -ErrorAction SilentlyContinue | Sort-Object Name
        $Ports = Get-PrinterPort -ErrorAction SilentlyContinue
        $Drivers = Get-PrinterDriver -ErrorAction SilentlyContinue
        $Default = ($Printers | Where-Object Default | Select-Object -First 1).Name
        $PrinterObjects = foreach ($p in $Printers) { [pscustomobject]@{ Name=$p.Name; DriverName=$p.DriverName; PortName=$p.PortName; IsDefault=($p.Name -eq $Default) } }
        @{ ComputerName=$env:COMPUTERNAME; CollectedAt=(Get-Date).ToString("s"); Printers=$PrinterObjects; Ports=$Ports; Drivers=$Drivers } | ConvertTo-Json -Depth 6 | Out-File (Join-Path $PrinterDir "Printers.json") -Encoding UTF8
        pnputil.exe /export-driver * (Join-Path $PrinterDir "Drivers") 2>$null
    } catch { Write-Warning "Printer backup failed: $($_.Exception.Message)" }
}

# SUMMARY
$TotalItems = (Get-ChildItem $BackupRoot -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
$Summary = "User: $User`nProfileDir: $ProfileDir`nSID: $Sid`nBackupRoot: $BackupRoot`nTotalItems: $TotalItems`nComputerName: $env:COMPUTERNAME`nExecutedAs: $([System.Security.Principal.WindowsIdentity]::GetCurrent().Name)`nCompleted: $(Get-Date)"
$Summary | Out-File (Join-Path $BackupRoot "BackupSummary.txt") -Encoding UTF8
New-Item (Join-Path $BackupRoot "BACKUP_COMPLETED.txt") -ItemType File -Force | Out-Null
Write-Host "=== DOMAIN MIGRATION BACKUP COMPLETED ==="
