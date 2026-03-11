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
    [string]$BackupLinks = "{{BackupLinks}}",
    [string]$BackupContacts = "{{BackupContacts}}",
    [string]$BackupSearches = "{{BackupSearches}}",
    [string]$BackupOutlook = "{{BackupOutlook}}",
    [string]$BackupChrome = "{{BackupChrome}}",
    [string]$BackupEdge = "{{BackupEdge}}",
    [string]$BackupFirefox = "{{BackupFirefox}}",
    [string]$BackupPrinters = "{{BackupPrinters}}"
)

# Fix unreplaced placeholders (when form fields left empty)
if ([string]::IsNullOrWhiteSpace($Destination) -or $Destination -match '^\{\{') { $Destination = '' }

trap {
    Write-Host "`n*** SCRIPT ERROR ***" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "`nPress Enter to close"
    exit 1
}

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
$BackupRoot = if ($Destination -and $Destination -notmatch '^\{\{') { (Join-Path $Destination.TrimEnd('\') $User) } else { "C:\DomainMigration\$User" }
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

# Create BackupSummary early so restore can find this folder (even if script fails later)
"User: $User`nProfileDir: $ProfileDir`nBackupRoot: $BackupRoot`nComputerName: $env:COMPUTERNAME`nStarted: $(Get-Date)" | Out-File (Join-Path $BackupRoot "BackupSummary.txt") -Encoding UTF8 -Force

# RESOLVE SID (only needed for Desktop/Documents/Pictures - skip if printers-only)
$Sid = $null
$DesktopPath = Join-Path $ProfileDir 'Desktop'
$DocsPath = Join-Path $ProfileDir 'Documents'
$PicturesPath = Join-Path $ProfileDir 'Pictures'
$NeedUserPaths = ($BackupDesktop -eq 'true' -or $BackupDocuments -eq 'true' -or $BackupPictures -eq 'true')
if ($NeedUserPaths) {
    try { $Sid = (New-Object System.Security.Principal.NTAccount($User)).Translate([System.Security.Principal.SecurityIdentifier]).Value }
    catch { Write-Error "Could not resolve SID for $User"; exit 1 }
    $CurrentSid = ([Security.Principal.WindowsIdentity]::GetCurrent().User).Value
    $RunningAsSystem = ($CurrentSid -eq 'S-1-5-18')
    $UserShellKey = "Registry::HKEY_USERS\$Sid\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders"
    if (-not $RunningAsSystem -and (Test-Path $UserShellKey)) {
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
}

# Check if folder is in OneDrive (already synced to cloud - skip backup)
function Test-OneDriveFolder { param([string]$Path) return $Path -and $Path -like '*OneDrive*' }

$BackupLog = [System.Collections.ArrayList]::new()

$DesktopInOD = Test-OneDriveFolder $DesktopPath
$DocsInOD = Test-OneDriveFolder $DocsPath
$PicturesInOD = Test-OneDriveFolder $PicturesPath

# CORE FOLDERS (Desktop, Documents, Pictures) - skip if in OneDrive
if ($BackupDesktop -eq 'true' -and (Test-Path $DesktopPath)) {
    if ($DesktopInOD) { Write-Host "Desktop in OneDrive - skipping (already in cloud)" -ForegroundColor Cyan; $BackupLog.Add("Desktop: SKIPPED (in OneDrive)") | Out-Null }
    else { Write-Host "Backing up Desktop..."; try { Invoke-RoboBackup -Source $DesktopPath -Destination (Join-Path $BackupRoot "Desktop"); $BackupLog.Add("Desktop: BACKED UP") | Out-Null } catch { Write-Warning $_.Exception.Message; $BackupLog.Add("Desktop: FAILED - $($_.Exception.Message)") | Out-Null } }
}
if ($BackupDocuments -eq 'true' -and (Test-Path $DocsPath)) {
    if ($DocsInOD) { Write-Host "Documents in OneDrive - skipping (already in cloud)" -ForegroundColor Cyan; $BackupLog.Add("Documents: SKIPPED (in OneDrive)") | Out-Null }
    else { Write-Host "Backing up Documents..."; try { Invoke-RoboBackup -Source $DocsPath -Destination (Join-Path $BackupRoot "Documents"); $BackupLog.Add("Documents: BACKED UP") | Out-Null } catch { Write-Warning $_.Exception.Message; $BackupLog.Add("Documents: FAILED - $($_.Exception.Message)") | Out-Null } }
}
if ($BackupPictures -eq 'true' -and (Test-Path $PicturesPath)) {
    if ($PicturesInOD) { Write-Host "Pictures in OneDrive - skipping (already in cloud)" -ForegroundColor Cyan; $BackupLog.Add("Pictures: SKIPPED (in OneDrive)") | Out-Null }
    else { Write-Host "Backing up Pictures..."; try { Invoke-RoboBackup -Source $PicturesPath -Destination (Join-Path $BackupRoot "Pictures"); $BackupLog.Add("Pictures: BACKED UP") | Out-Null } catch { Write-Warning $_.Exception.Message; $BackupLog.Add("Pictures: FAILED - $($_.Exception.Message)") | Out-Null } }
}

# EXTRA FOLDERS - skip Downloads if in OneDrive
$ExtraMap = @{
    Downloads = @{ Backup = $BackupDownloads; Path = (Join-Path $ProfileDir 'Downloads') }
    Favorites = @{ Backup = $BackupFavorites; Path = (Join-Path $ProfileDir 'Favorites') }
    Links = @{ Backup = $BackupLinks; Path = (Join-Path $ProfileDir 'Links') }
    Contacts = @{ Backup = $BackupContacts; Path = (Join-Path $ProfileDir 'Contacts') }
    Searches = @{ Backup = $BackupSearches; Path = (Join-Path $ProfileDir 'Searches') }
}
foreach ($Folder in $ExtraMap.Keys) {
    $cfg = $ExtraMap[$Folder]
    if ($cfg.Backup -eq 'true' -and (Test-Path $cfg.Path)) {
        if ((Test-OneDriveFolder $cfg.Path)) { Write-Host "$Folder in OneDrive - skipping (already in cloud)" -ForegroundColor Cyan; $BackupLog.Add("$Folder`: SKIPPED (in OneDrive)") | Out-Null }
        else { Write-Host "Backing up $Folder..."; try { Invoke-RoboBackup -Source $cfg.Path -Destination (Join-Path $BackupRoot $Folder); $BackupLog.Add("$Folder`: BACKED UP") | Out-Null } catch { Write-Warning $_.Exception.Message; $BackupLog.Add("$Folder`: FAILED - $($_.Exception.Message)") | Out-Null } }
    }
}

# OUTLOOK
if ($BackupOutlook -eq 'true') {
    $Outlook = Join-Path $ProfileDir "AppData\Roaming\Microsoft\Outlook"
    if (Test-Path $Outlook) { Write-Host "Backing up Outlook..."; try { Invoke-RoboBackup -Source $Outlook -Destination (Join-Path $BackupRoot "Outlook"); $BackupLog.Add("Outlook: BACKED UP") | Out-Null } catch { Write-Warning $_.Exception.Message; $BackupLog.Add("Outlook: FAILED - $($_.Exception.Message)") | Out-Null } }
}
# BROWSERS
if ($BackupChrome -eq 'true') {
    $Chrome = Join-Path $ProfileDir "AppData\Local\Google\Chrome\User Data"
    if (Test-Path $Chrome) { Write-Host "Backing up Chrome..."; try { Invoke-RoboBackup -Source $Chrome -Destination (Join-Path $BackupRoot "Chrome"); $BackupLog.Add("Chrome: BACKED UP") | Out-Null } catch { Write-Warning $_.Exception.Message; $BackupLog.Add("Chrome: FAILED - $($_.Exception.Message)") | Out-Null } }
}
if ($BackupEdge -eq 'true') {
    $Edge = Join-Path $ProfileDir "AppData\Local\Microsoft\Edge\User Data"
    if (Test-Path $Edge) { Write-Host "Backing up Edge..."; try { Invoke-RoboBackup -Source $Edge -Destination (Join-Path $BackupRoot "Edge"); $BackupLog.Add("Edge: BACKED UP") | Out-Null } catch { Write-Warning $_.Exception.Message; $BackupLog.Add("Edge: FAILED - $($_.Exception.Message)") | Out-Null } }
}
if ($BackupFirefox -eq 'true') {
    $Firefox = Join-Path $ProfileDir "AppData\Roaming\Mozilla"
    if (Test-Path $Firefox) { Write-Host "Backing up Firefox..."; try { Invoke-RoboBackup -Source $Firefox -Destination (Join-Path $BackupRoot "Firefox"); $BackupLog.Add("Firefox: BACKED UP") | Out-Null } catch { Write-Warning $_.Exception.Message; $BackupLog.Add("Firefox: FAILED - $($_.Exception.Message)") | Out-Null } }
}

# PRINTERS - full backup with PrintBrm (drivers, ports, printers) for restore
if ($BackupPrinters -eq 'true') {
    $PrinterDir = Join-Path $BackupRoot "Printers"
    New-Item -ItemType Directory -Path $PrinterDir -Force | Out-Null
    try {
        Import-Module PrintManagement -ErrorAction Stop
        $Printers = Get-Printer -ErrorAction SilentlyContinue | Sort-Object Name
        if ($Printers.Count -eq 0) {
            Write-Host "No printers found on this system." -ForegroundColor Yellow
            $BackupLog.Add("Printers: SKIPPED (none found)") | Out-Null
        } else {
            Write-Host "Found $($Printers.Count) printer(s): $($Printers.Name -join ', ')"
            $Default = ($Printers | Where-Object Default | Select-Object -First 1).Name
            $PrintersList = @()
            foreach ($p in $Printers) {
                $PortInfo = $null
                try { $PortInfo = Get-PrinterPort -Name $p.PortName -ErrorAction SilentlyContinue } catch {}
                $pi = @{ Name=$p.Name; DriverName=$p.DriverName; PortName=$p.PortName; IsDefault=($p.Name -eq $Default) }
                if ($PortInfo -and $PortInfo.PrinterHostAddress) { $pi.PortAddress = $PortInfo.PrinterHostAddress }
                $PrintersList += [pscustomobject]$pi
            }
            $Ports = Get-PrinterPort -ErrorAction SilentlyContinue
            $Drivers = Get-PrinterDriver -ErrorAction SilentlyContinue
            @{ ComputerName=$env:COMPUTERNAME; CollectedAt=(Get-Date).ToString("s"); Printers=$PrintersList; Ports=$Ports; Drivers=$Drivers } | ConvertTo-Json -Depth 6 | Out-File (Join-Path $PrinterDir "Printers.json") -Encoding UTF8

            $PrintBrmPath = Join-Path $env:SystemRoot "System32\spool\tools\printbrm.exe"
            $ExportPath = Join-Path $PrinterDir "Printers.printerExport"
            if (Test-Path $PrintBrmPath) {
                Write-Host "Backing up printers (PrintBrm) - drivers, ports, queues..."
                try {
                    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
                    $pinfo.FileName = $PrintBrmPath
                    $pinfo.Arguments = "-b -s \\$env:COMPUTERNAME -f `"$ExportPath`""
                    $pinfo.RedirectStandardError = $true
                    $pinfo.RedirectStandardOutput = $true
                    $pinfo.UseShellExecute = $false
                    $p = New-Object System.Diagnostics.Process
                    $p.StartInfo = $pinfo
                    $p.Start() | Out-Null
                    $out = $p.StandardOutput.ReadToEnd()
                    $err = $p.StandardError.ReadToEnd()
                    $p.WaitForExit()
                    if ($p.ExitCode -ne 0 -or -not (Test-Path $ExportPath)) {
                        Write-Warning "PrintBrm exit code: $($p.ExitCode). Printers.json saved - use for manual restore."
                        if ($err) { Write-Host $err -ForegroundColor Yellow }
                    } else {
                        Write-Host "Printer backup complete: $ExportPath" -ForegroundColor Green
                    }
                } catch {
                    Write-Warning "PrintBrm failed: $($_.Exception.Message). Printers.json saved for reference."
                }
                if (-not (Test-Path $ExportPath)) {
                    Write-Host "Exporting printer drivers only (PrintBrm fallback)..."
                    $DriversDir = Join-Path $PrinterDir "Drivers"
                    New-Item -ItemType Directory -Path $DriversDir -Force | Out-Null
                    $UsedDrivers = $PrintersList | Select-Object -ExpandProperty DriverName -Unique
                    foreach ($dName in $UsedDrivers) {
                        $drv = Get-PrinterDriver -Name $dName -ErrorAction SilentlyContinue
                        if ($drv -and $drv.InfPath -and $drv.Manufacturer -notmatch 'Microsoft') {
                            $src = Split-Path $drv.InfPath -Parent
                            if (Test-Path $src) {
                                $dest = Join-Path $DriversDir ($dName -replace '[\\/:*?"<>|]','_')
                                New-Item $dest -ItemType Directory -Force | Out-Null
                                Copy-Item "$src\*" $dest -Recurse -Force -ErrorAction SilentlyContinue
                            }
                        }
                    }
                }
            } else {
                Write-Warning "PrintBrm not found. Exporting printer drivers only."
                $DriversDir = Join-Path $PrinterDir "Drivers"
                New-Item -ItemType Directory -Path $DriversDir -Force | Out-Null
                $UsedDrivers = $PrintersList | Select-Object -ExpandProperty DriverName -Unique
                foreach ($dName in $UsedDrivers) {
                    $drv = Get-PrinterDriver -Name $dName -ErrorAction SilentlyContinue
                    if ($drv -and $drv.InfPath -and $drv.Manufacturer -notmatch 'Microsoft') {
                        $src = Split-Path $drv.InfPath -Parent
                        if (Test-Path $src) {
                            $dest = Join-Path $DriversDir ($dName -replace '[\\/:*?"<>|]','_')
                            New-Item $dest -ItemType Directory -Force | Out-Null
                            Copy-Item "$src\*" $dest -Recurse -Force -ErrorAction SilentlyContinue
                        }
                    }
                }
            }
            $BackupLog.Add("Printers: BACKED UP ($($Printers.Count) printer(s) - $($Printers.Name -join ', '))") | Out-Null
        }
    } catch { Write-Warning "Printer backup failed: $($_.Exception.Message)"; $BackupLog.Add("Printers: FAILED - $($_.Exception.Message)") | Out-Null }
}

# SUMMARY
$TotalItems = (Get-ChildItem $BackupRoot -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
$LogSection = if ($BackupLog.Count -gt 0) { "`n--- BACKUP LOG ---`n" + ($BackupLog -join "`n") } else { "" }
$Summary = "User: $User`nProfileDir: $ProfileDir`nSID: $Sid`nBackupRoot: $BackupRoot`nTotalItems: $TotalItems`nComputerName: $env:COMPUTERNAME`nExecutedAs: $([System.Security.Principal.WindowsIdentity]::GetCurrent().Name)`nCompleted: $(Get-Date)$LogSection"
$Summary | Out-File (Join-Path $BackupRoot "BackupSummary.txt") -Encoding UTF8
New-Item (Join-Path $BackupRoot "BACKUP_COMPLETED.txt") -ItemType File -Force | Out-Null
Write-Host "=== DOMAIN MIGRATION BACKUP COMPLETED ===" -ForegroundColor Green
Write-Host "Backup location: $BackupRoot"
Read-Host "`nPress Enter to close"
