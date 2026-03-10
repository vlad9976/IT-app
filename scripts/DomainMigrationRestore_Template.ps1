# ==========================================================
# DOMAIN MIGRATION – RESTORE SCRIPT
# Auto-detects what was backed up and restores it (no checkboxes)
# ==========================================================

param(
    [string]$Source = "{{Source}}",
    [string]$UserName = "{{UserName}}",
    [string]$TargetProfilePath = "{{TargetProfilePath}}"
)

Write-Host "=== DOMAIN MIGRATION RESTORE STARTED ==="

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Error "Run this script as Administrator."
    exit 1
}

function Test-ValidUserProfile { param([string]$Path)
    if (-not (Test-Path $Path)) { return $false }
    $Leaf = Split-Path $Path -Leaf
    $Excluded = @('Public','Default','Default User','All Users','Administrator','WDAGUtilityAccount')
    if ($Leaf -in $Excluded -or $Leaf -match '^TEMP\.') { return $false }
    return (Test-Path (Join-Path $Path 'NTUSER.DAT'))
}

function Get-TargetUserProfile { param([string]$PreferUserName = $null)
    $CandidatePaths = [System.Collections.Generic.List[string]]::new()
    if ($PreferUserName) { $CandidatePaths.Add("C:\Users\$PreferUserName") }
    try {
        $LastUser = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\LogonUI" -ErrorAction Stop).LastLoggedOnUser
        if ($LastUser) {
            $UserPart = ($LastUser -split "\\")[-1]
            if ($UserPart.StartsWith(".\")) { $UserPart = $UserPart.Substring(2) }
            if ($UserPart -and ("C:\Users\$UserPart" -notin $CandidatePaths)) { $CandidatePaths.Add("C:\Users\$UserPart") }
        }
    } catch {}
    try {
        foreach ($p in (Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList' -ErrorAction SilentlyContinue)) {
            $pi = Get-ItemProperty $p.PSPath -ErrorAction SilentlyContinue
            if ($pi.ProfileImagePath -like 'C:\Users\*') {
                $exp = [Environment]::ExpandEnvironmentVariables($pi.ProfileImagePath)
                if ($exp -notin $CandidatePaths) { $CandidatePaths.Add($exp) }
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

function Invoke-RoboRestore { param([string]$Source, [string]$Destination)
    if (-not (Test-Path $Source)) { return }
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    & robocopy $Source $Destination /E /COPY:DAT /R:1 /W:1 /NFL /NDL /NP /IS /IT | Out-Null
    if ($LASTEXITCODE -ge 8) { Write-Warning "Robocopy reported issues (exit $LASTEXITCODE)" }
    else { Write-Host "Restored: $Destination" }
}

# DETECT TARGET PROFILE
$ProfileInfo = if ($TargetProfilePath -and (Test-ValidUserProfile $TargetProfilePath)) {
    [pscustomobject]@{ UserName = (Split-Path $TargetProfilePath -Leaf); ProfileDir = $TargetProfilePath }
} else {
    Get-TargetUserProfile -PreferUserName $UserName
}

if (-not $ProfileInfo) {
    Write-Error "No valid target user profile found. User may need to log on once."
    exit 1
}

$ProfileDir = $ProfileInfo.ProfileDir
$User = $ProfileInfo.UserName

Write-Host "Detected user: $User"
Write-Host "Using profile: $ProfileDir"

# FIND BACKUP
$MigrationRoot = if ($Source) { $Source.TrimEnd('\') } else { "C:\DomainMigration" }
$BackupRoot = $null

if ($Source -and (Test-Path (Join-Path $MigrationRoot "BackupSummary.txt"))) {
    $BackupRoot = $MigrationRoot
    Write-Host "Using source path: $BackupRoot"
} else {
    $BackupUser = $UserName
    if (-not $BackupUser) {
        $ProfileLeaf = Split-Path $ProfileDir -Leaf
        foreach ($candidate in @($ProfileLeaf, ($ProfileLeaf -replace '\..*$',''), "user", "User")) {
            if ($candidate -and (Test-Path (Join-Path $MigrationRoot $candidate))) {
                $BackupUser = $candidate
                break
            }
        }
    }
    $BackupRoot = Join-Path $MigrationRoot $BackupUser
    if (-not $BackupRoot -or -not (Test-Path $BackupRoot)) {
        $Found = Get-ChildItem $MigrationRoot -Directory -ErrorAction SilentlyContinue | Where-Object {
            Test-Path (Join-Path $_.FullName "BackupSummary.txt")
        } | Select-Object -First 1
        if ($Found) { $BackupRoot = $Found.FullName }
    }
}

if (-not $BackupRoot -or -not (Test-Path $BackupRoot)) {
    Write-Error "Backup not found. Check path or run backup first."
    exit 1
}

Write-Host "Restoring from: $BackupRoot"

# RESOLVE SID AND USER SHELL FOLDERS (for Desktop, Documents, Pictures)
$Sid = $null
try { $Sid = (New-Object System.Security.Principal.NTAccount($User)).Translate([System.Security.Principal.SecurityIdentifier]).Value } catch {}
$CurrentSid = ([Security.Principal.WindowsIdentity]::GetCurrent().User).Value
$RunningAsSystem = ($CurrentSid -eq 'S-1-5-18')

$DesktopPath = Join-Path $ProfileDir 'Desktop'
$DocsPath = Join-Path $ProfileDir 'Documents'
$PicturesPath = Join-Path $ProfileDir 'Pictures'

if (-not $RunningAsSystem -and $Sid -and (Test-Path "Registry::HKEY_USERS\$Sid\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders")) {
    try {
        $UShell = Get-ItemProperty "Registry::HKEY_USERS\$Sid\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" -ErrorAction Stop
        $DesktopPath = Expand-UserPath $UShell.Desktop -UserProfileDir $ProfileDir
        $DocsPath = Expand-UserPath $UShell.Personal -UserProfileDir $ProfileDir
        $PicturesPath = Expand-UserPath $UShell.'My Pictures' -UserProfileDir $ProfileDir
        if (-not $DesktopPath) { $DesktopPath = Join-Path $ProfileDir 'Desktop' }
        if (-not $DocsPath) { $DocsPath = Join-Path $ProfileDir 'Documents' }
        if (-not $PicturesPath) { $PicturesPath = Join-Path $ProfileDir 'Pictures' }
    } catch {}
}

# MAP: Backup folder name -> destination path in profile
$ProfileFolderMap = @{
    'Desktop'   = $DesktopPath
    'Documents' = $DocsPath
    'Pictures'  = $PicturesPath
    'Downloads' = Join-Path $ProfileDir 'Downloads'
    'Favorites' = Join-Path $ProfileDir 'Favorites'
    'Music'     = Join-Path $ProfileDir 'Music'
    'Videos'    = Join-Path $ProfileDir 'Videos'
    'Links'     = Join-Path $ProfileDir 'Links'
    'Saved Games' = Join-Path $ProfileDir 'Saved Games'
    'Contacts'  = Join-Path $ProfileDir 'Contacts'
    'Searches'  = Join-Path $ProfileDir 'Searches'
    '3D Objects' = Join-Path $ProfileDir '3D Objects'
    'OneDrive'  = Join-Path $ProfileDir 'OneDrive'
}

$AppFolderMap = @{
    'Outlook' = Join-Path $ProfileDir 'AppData\Roaming\Microsoft\Outlook'
    'Chrome'  = Join-Path $ProfileDir 'AppData\Local\Google\Chrome\User Data'
    'Edge'    = Join-Path $ProfileDir 'AppData\Local\Microsoft\Edge\User Data'
    'Firefox' = Join-Path $ProfileDir 'AppData\Roaming\Mozilla'
}

$SkipFolders = @('Printers')
$SkipFiles = @('BackupSummary.txt', 'BACKUP_COMPLETED.txt', 'RESTORE_PrinterConfig.txt', 'RESTORE_COMPLETED.txt')

# SCAN BACKUP - restore whatever exists
Write-Host "Scanning backup for items to restore..."
$BackedUpItems = Get-ChildItem $BackupRoot -Directory -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -notin $SkipFolders
}

foreach ($Item in $BackedUpItems) {
    $Name = $Item.Name
    $Src = $Item.FullName

    if ($ProfileFolderMap.ContainsKey($Name)) {
        $Dest = $ProfileFolderMap[$Name]
        Write-Host "Restoring $Name -> $Dest"
        try { Invoke-RoboRestore -Source $Src -Destination $Dest } catch { Write-Warning $_.Exception.Message }
    }
    elseif ($AppFolderMap.ContainsKey($Name)) {
        $Dest = $AppFolderMap[$Name]
        Write-Host "Restoring $Name -> $Dest"
        try { Invoke-RoboRestore -Source $Src -Destination $Dest } catch { Write-Warning $_.Exception.Message }
    }
    else {
        $Dest = Join-Path $ProfileDir $Name
        Write-Host "Restoring $Name -> $Dest (direct profile folder)"
        try { Invoke-RoboRestore -Source $Src -Destination $Dest } catch { Write-Warning $_.Exception.Message }
    }
}

# PRINTERS - export config for reference (backup script stores Printers folder)
$PrinterDir = Join-Path $BackupRoot "Printers"
$PrinterJson = Join-Path $PrinterDir "Printers.json"
if (Test-Path $PrinterJson) {
    Write-Host "Printer backup found. Saving config for reference..."
    try {
        $Snapshot = Get-Content $PrinterJson -Raw | ConvertFrom-Json
        $Snapshot | ConvertTo-Json -Depth 4 | Out-File (Join-Path $BackupRoot "RESTORE_PrinterConfig.txt") -Encoding UTF8
        Write-Host "Printer config saved to RESTORE_PrinterConfig.txt"
    } catch { Write-Warning $_.Exception.Message }
}

# COMPLETE
$Summary = "RESTORE COMPLETED`nSource: $BackupRoot`nTarget: $ProfileDir`nCompleted: $(Get-Date)"
$Summary | Out-File (Join-Path $BackupRoot "RESTORE_COMPLETED.txt") -Encoding UTF8 -Append
Write-Host "=== DOMAIN MIGRATION RESTORE COMPLETED ==="
