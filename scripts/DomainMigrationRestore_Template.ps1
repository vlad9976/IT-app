# ==========================================================
# DOMAIN MIGRATION – RESTORE SCRIPT
# Auto-detects what was backed up and restores it (no checkboxes)
# ==========================================================

param(
    [string]$Source = "{{Source}}",
    [string]$UserName = "{{UserName}}",
    [string]$TargetProfilePath = "{{TargetProfilePath}}"
)

# Fix unreplaced placeholders
if ($Source -match '^\{\{') { $Source = '' }
if ($UserName -match '^\{\{') { $UserName = '' }
if ($TargetProfilePath -match '^\{\{') { $TargetProfilePath = '' }

trap {
    Write-Host "`n*** SCRIPT ERROR ***" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    Read-Host "`nPress Enter to close"
    exit 1
}

Write-Host "=== DOMAIN MIGRATION RESTORE STARTED ==="

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Error "Run this script as Administrator."
    Read-Host "Press Enter to close"
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
    Read-Host "Press Enter to close"
    exit 1
}

$ProfileDir = $ProfileInfo.ProfileDir
$User = $ProfileInfo.UserName

Write-Host "Detected user: $User"
Write-Host "Using profile: $ProfileDir"

# FIND BACKUP
$BackupRoot = $null
$SearchRoots = @()
if ($Source) {
    $SearchRoots = @($Source.TrimEnd('\'))
} else {
    $SearchRoots = @("C:\DomainMigration", "C:\Backup")
    foreach ($d in @("D:\DomainMigration", "D:\Backup", "E:\DomainMigration", "E:\Backup")) {
        if (Test-Path $d) { $SearchRoots += $d }
    }
}

$IsValidBackup = { param($p) (Test-Path (Join-Path $p "BackupSummary.txt")) -or (Test-Path (Join-Path $p "Printers\Printers.json")) -or (Test-Path (Join-Path $p "Printers\Printers.printerExport")) }
foreach ($MigrationRoot in $SearchRoots) {
    if (-not (Test-Path $MigrationRoot)) { continue }
    if (& $IsValidBackup $MigrationRoot) { $BackupRoot = $MigrationRoot; break }
    $ProfileLeaf = Split-Path $ProfileDir -Leaf
    foreach ($candidate in @($ProfileLeaf, ($ProfileLeaf -replace '\..*$',''), $UserName, "user", "User")) {
        if (-not $candidate) { continue }
        $candidatePath = Join-Path $MigrationRoot $candidate
        if (& $IsValidBackup $candidatePath) { $BackupRoot = $candidatePath; break }
    }
    if ($BackupRoot) { break }
    $Found = Get-ChildItem $MigrationRoot -Directory -ErrorAction SilentlyContinue | Where-Object {
        & $IsValidBackup $_.FullName
    } | Select-Object -First 1
    if ($Found) { $BackupRoot = $Found.FullName; break }
}

if (-not $BackupRoot -or -not (Test-Path $BackupRoot)) {
    Write-Host "`nBackup not found. Searched:" -ForegroundColor Yellow
    foreach ($r in $SearchRoots) { Write-Host "  - $r" -ForegroundColor Gray }
    Write-Host "`nEnter the full path to your backup folder in the Source field." -ForegroundColor Yellow
    Write-Host "Example: C:\DomainMigration\YourUsername  or  C:\Backup\YourUsername" -ForegroundColor Gray
    Write-Host "The folder must contain BackupSummary.txt" -ForegroundColor Gray
    Read-Host "`nPress Enter to close"
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

# PRINTERS - full restore using PrintBrm (if .printerExport exists)
$PrinterDir = Join-Path $BackupRoot "Printers"
$PrintBrmExport = Join-Path $PrinterDir "Printers.printerExport"
$PrinterJson = Join-Path $PrinterDir "Printers.json"
if (Test-Path $PrintBrmExport) {
    Write-Host "Restoring printers (PrintBrm)..."
    $PrintBrmPath = Join-Path $env:SystemRoot "System32\spool\tools\printbrm.exe"
    if (Test-Path $PrintBrmPath) {
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = $PrintBrmPath
        $pinfo.Arguments = "-r -s \\$env:COMPUTERNAME -f `"$PrintBrmExport`" -o force -noacl"
        $pinfo.RedirectStandardError = $true
        $pinfo.RedirectStandardOutput = $true
        $pinfo.UseShellExecute = $false
        $pinfo.CreateNoWindow = $false
        $p = New-Object System.Diagnostics.Process
        $p.StartInfo = $pinfo
        $p.Start() | Out-Null
        $out = $p.StandardOutput.ReadToEnd()
        $err = $p.StandardError.ReadToEnd()
        $p.WaitForExit()
        if ($p.ExitCode -ne 0) {
            Write-Warning "PrintBrm exit code: $($p.ExitCode)"
            if ($err) { Write-Host $err -ForegroundColor Yellow }
            if ($out) { Write-Host $out }
        } else {
            Write-Host "Printers restored successfully." -ForegroundColor Green
        }
    } else {
        Write-Warning "PrintBrm not found at $PrintBrmPath. Cannot restore printers."
    }
} elseif (Test-Path $PrinterJson) {
    Write-Host "Printers.printerExport not found. Attempting restore from Printers.json + Drivers..."
    try {
        Import-Module PrintManagement -ErrorAction Stop
        $Snapshot = Get-Content $PrinterJson -Raw -ErrorAction Stop | ConvertFrom-Json
        $DriversDir = Join-Path $PrinterDir "Drivers"
        $DefaultPrinter = ($Snapshot.Printers | Where-Object { $_.IsDefault -eq $true } | Select-Object -First 1).Name
        $driverFolders = if (Test-Path $DriversDir) { @(Get-ChildItem $DriversDir -Directory -ErrorAction SilentlyContinue) } else { @() }
        if ($driverFolders.Count -eq 0) { Write-Host "  No Drivers folder found - run backup again with Printers checked." -ForegroundColor Yellow }
        foreach ($p in $Snapshot.Printers) {
            $driverName = ($p.DriverName -replace '\s+$','').Trim()
            $portName = $p.PortName
            $printerName = $p.Name
            if (Get-Printer -Name $printerName -ErrorAction SilentlyContinue) { Write-Host "  $printerName already exists."; continue }
            $driverInstalled = Get-PrinterDriver -Name $driverName -ErrorAction SilentlyContinue
            if (-not $driverInstalled -and $driverFolders.Count -gt 0) {
                $driverFolder = $driverFolders | Where-Object { $_.Name -replace '[\\/:*?"<>|]','_' -eq ($driverName -replace '[\\/:*?"<>|]','_') } | Select-Object -First 1
                if (-not $driverFolder) { $driverFolder = $driverFolders | Where-Object { $_.Name -like "*$($driverName.Split(' ')[0])*" } | Select-Object -First 1 }
                if (-not $driverFolder) { $driverFolder = $driverFolders[0] }
                if ($driverFolder) {
                    $infFile = Get-ChildItem $driverFolder.FullName -Filter "*.inf" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch '^(oem|pnputil)' } | Select-Object -First 1
                    if (-not $infFile) { $infFile = Get-ChildItem $driverFolder.FullName -Filter "*.inf" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 }
                    if ($infFile) {
                        Write-Host "  Installing driver for $printerName from $($infFile.Name)..."
                        $pnpresult = & pnputil.exe /add-driver "`"$($infFile.FullName)`"" /install 2>&1
                        if ($LASTEXITCODE -ne 0) {
                            Write-Host "  pnputil: $pnpresult" -ForegroundColor Gray
                            Write-Host "  Trying printui (direct INF install)..."
                            Start-Process -FilePath "rundll32.exe" -ArgumentList "printui.dll,PrintUIEntry /ia /m `"$driverName`" /f `"$($infFile.FullName)`"" -Wait -NoNewWindow
                        } else { Write-Host "  Driver added to store." -ForegroundColor Green }
                    } else { Write-Host "  No .inf found in $($driverFolder.Name)" -ForegroundColor Yellow }
                }
            }
            $portExists = Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue
            if (-not $portExists -and $p.PortAddress) {
                Write-Host "  Adding TCP/IP port $portName -> $($p.PortAddress)..."
                try { Add-PrinterPort -Name $portName -PrinterHostAddress $p.PortAddress } catch { Add-PrinterPort -Name "IP_$($p.PortAddress)" -PrinterHostAddress $p.PortAddress; $portName = "IP_$($p.PortAddress)" }
            }
            $driverNow = Get-PrinterDriver -Name $driverName -ErrorAction SilentlyContinue
            $portNow = Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue
            if ($driverNow -and $portNow) {
                Add-Printer -Name $printerName -DriverName $driverName -PortName $portName -ErrorAction Stop
                Write-Host "  Added printer: $printerName" -ForegroundColor Green
                if ($printerName -eq $DefaultPrinter) { try { (Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Name='$($printerName -replace "'","''")'").SetDefaultPrinter() | Out-Null } catch {} }
            } else {
                $why = @()
                if (-not $driverNow) { $why += "driver '$driverName' not installed" }
                if (-not $portNow) { $why += "port '$portName' missing" }
                Write-Warning "  Could not add $printerName - $($why -join '; ')."
                Write-Host "    Driver folders: $($driverFolders.Name -join ', ')" -ForegroundColor Gray
                Write-Host "    Install driver from: $DriversDir" -ForegroundColor Gray
            }
        }
    } catch { Write-Warning "Printer restore from JSON failed: $($_.Exception.Message)" }
}
if (Test-Path $PrinterJson) {
    try {
        $Snapshot = Get-Content $PrinterJson -Raw -ErrorAction Stop | ConvertFrom-Json
        $Snapshot | ConvertTo-Json -Depth 4 | Out-File (Join-Path $BackupRoot "RESTORE_PrinterConfig.txt") -Encoding UTF8 -ErrorAction SilentlyContinue
    } catch {}
}

# COMPLETE
$Summary = "RESTORE COMPLETED`nSource: $BackupRoot`nTarget: $ProfileDir`nCompleted: $(Get-Date)"
$Summary | Out-File (Join-Path $BackupRoot "RESTORE_COMPLETED.txt") -Encoding UTF8 -Append -ErrorAction SilentlyContinue
Write-Host "=== DOMAIN MIGRATION RESTORE COMPLETED ===" -ForegroundColor Green
Read-Host "`nPress Enter to close"
