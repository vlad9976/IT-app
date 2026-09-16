# ================================================================
# UNINSTALL MICROSOFT 365 / OFFICE
# Removes detected Microsoft 365 Apps, Office Click-to-Run,
# MSI Office, Visio, and Project. Optional Microsoft official scrub.
#
# No WinGet required
# Run as Administrator
# Close Word/Excel/Outlook before running (script also closes them)
# ================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$UninstallClickToRun = ('{{UninstallClickToRun}}' -eq 'true')
$UninstallMsiOffice  = ('{{UninstallMsiOffice}}' -eq 'true')
$RunMicrosoftScrub   = ('{{RunMicrosoftScrub}}' -eq 'true')
$RemoveLeftovers     = ('{{RemoveLeftovers}}' -eq 'true')

$TempDir = Join-Path $env:TEMP "OfficeUninstaller"

New-Item -Path $TempDir -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null


# ================================================================
# ADMIN CHECK
# ================================================================

$IsAdmin = (
    [Security.Principal.WindowsPrincipal]
    [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $IsAdmin) {
    Write-Host ""
    Write-Host "ERROR: PowerShell must be Run as Administrator." -ForegroundColor Red
    Write-Host ""
    Read-Host "Press ENTER to close"
    return
}

if (-not ($UninstallClickToRun -or $UninstallMsiOffice -or $RunMicrosoftScrub -or $RemoveLeftovers)) {
    Write-Host ""
    Write-Host "No uninstall options selected. Check at least one option and generate the script again." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press ENTER to close"
    return
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12


# ================================================================
# FUNCTIONS
# ================================================================

function Test-OfficeDisplayName {
    param([string]$Name)

    if ([string]::IsNullOrWhiteSpace($Name)) { return $false }

    if ($Name -match 'Update for|Hotfix|Service Pack|Proofing|Language Pack|MUI Language|Click-to-Run Extensibility|Licensing Component|Office OSM|Office Push Update|Localization Component') {
        return $false
    }

    return (
        $Name -match 'Microsoft 365' -or
        $Name -match 'Microsoft Office' -or
        $Name -match 'Office (16|15|19|21|24|LTSC)' -or
        $Name -match 'Microsoft Visio' -or
        $Name -match 'Microsoft Project'
    )
}

function Get-InstalledOfficeProducts {
    Get-ItemProperty `
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*", `
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" `
        -ErrorAction SilentlyContinue |
        Where-Object { Test-OfficeDisplayName $_.DisplayName } |
        Sort-Object DisplayName -Unique
}

function Get-ClickToRunExe {
    @(
        "$env:ProgramFiles\Common Files\Microsoft Shared\ClickToRun\OfficeClickToRun.exe",
        "${env:ProgramFiles(x86)}\Common Files\Microsoft Shared\ClickToRun\OfficeClickToRun.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}

function Close-OfficeApps {
    $names = @(
        'WINWORD', 'EXCEL', 'POWERPNT', 'OUTLOOK', 'MSACCESS', 'MSPUB',
        'ONENOTE', 'ONENOTEM', 'VISIO', 'WINPROJ', 'LYNC', 'GROOVE',
        'MSOSYNC', 'OfficeClickToRun', 'integrator', 'olk'
    )

    $running = Get-Process -Name $names -ErrorAction SilentlyContinue
    if (-not $running) {
        Write-Host "No running Office apps." -ForegroundColor Green
        return
    }

    Write-Host "Closing Office apps: $(($running.Name | Sort-Object -Unique) -join ', ')" -ForegroundColor Yellow
    $running | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}


# ================================================================
# START
# ================================================================

$ClickToRunOK = $false
$MsiOK = $false
$ScrubOK = $false
$LeftoversOK = $false

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " UNINSTALL MICROSOFT 365 / OFFICE" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$Products = @(Get-InstalledOfficeProducts)

Write-Host ""
Write-Host "Detected Office / Microsoft 365 products:" -ForegroundColor Yellow
if ($Products.Count -eq 0) {
    Write-Host "  (none listed in Uninstall registry)" -ForegroundColor Gray
}
else {
    foreach ($p in $Products) {
        $ver = if ($p.DisplayVersion) { $p.DisplayVersion } else { '?' }
        Write-Host "  - $($p.DisplayName)  ($ver)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Closing Office applications..." -ForegroundColor Yellow
Close-OfficeApps


# ================================================================
# CLICK-TO-RUN
# ================================================================

if ($UninstallClickToRun) {

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "CLICK-TO-RUN / MICROSOFT 365 APPS" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {
        $Ctr = Get-ClickToRunExe
        if (-not $Ctr) {
            Write-Host "OfficeClickToRun.exe not found. Skipping C2R uninstall." -ForegroundColor Gray
            $ClickToRunOK = $true
        }
        else {
            Write-Host "Using: $Ctr"
            Write-Host "Uninstalling Click-to-Run Office silently..."

            $proc = Start-Process `
                -FilePath $Ctr `
                -ArgumentList @(
                    "scenario=install",
                    "scenariosubtype=uninstall",
                    "displaylevel=false",
                    "forceappshutdown=true"
                ) `
                -Wait `
                -PassThru

            Write-Host "Click-to-Run exit code: $($proc.ExitCode)"
            Start-Sleep -Seconds 3
            $ClickToRunOK = $true
            Write-Host "[OK] Click-to-Run uninstall finished." -ForegroundColor Green
        }
    }
    catch {
        Write-Host ""
        Write-Host "[FAIL] Click-to-Run uninstall" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}


# ================================================================
# MSI OFFICE
# ================================================================

if ($UninstallMsiOffice) {

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "MSI OFFICE / VISIO / PROJECT" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {
        $MsiProducts = @(Get-InstalledOfficeProducts | Where-Object {
            $_.UninstallString -match 'msiexec' -or $_.PSChildName -match '^\{[0-9A-F-]{36}\}$'
        })

        if ($MsiProducts.Count -eq 0) {
            Write-Host "No MSI Office products found." -ForegroundColor Gray
            $MsiOK = $true
        }
        else {
            foreach ($prod in $MsiProducts) {
                $guid = $prod.PSChildName
                Write-Host "Uninstalling: $($prod.DisplayName)" -ForegroundColor Yellow

                if ($guid -match '^\{[0-9A-Fa-f-]{36}\}$') {
                    $msi = Start-Process `
                        -FilePath "msiexec.exe" `
                        -ArgumentList @("/x", $guid, "/qn", "/norestart") `
                        -Wait `
                        -PassThru
                    Write-Host "  msiexec exit code: $($msi.ExitCode)"
                }
                elseif ($prod.UninstallString) {
                    $us = $prod.UninstallString
                    if ($us -match 'msiexec') {
                        $us = ($us -replace '/I', '/x' -replace '/i', '/x')
                        if ($us -notmatch '/qn') { $us += ' /qn /norestart' }
                        cmd /c $us
                    }
                    else {
                        Write-Host "  Skipping non-MSI uninstall string." -ForegroundColor Gray
                    }
                }
            }
            $MsiOK = $true
            Write-Host "[OK] MSI uninstall finished." -ForegroundColor Green
        }
    }
    catch {
        Write-Host ""
        Write-Host "[FAIL] MSI uninstall" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}


# ================================================================
# MICROSOFT OFFICIAL SCRUB (Get Help command line)
# https://learn.microsoft.com/en-us/troubleshoot/microsoft-365/admin/miscellaneous/get-help-office-uninstall
# ================================================================

if ($RunMicrosoftScrub) {

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "MICROSOFT COMPLETE OFFICE SCRUB (ALL VERSIONS)" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {
        Write-Host "Closing Office apps again before official scrub..."
        Close-OfficeApps

        $ZipPath = Join-Path $TempDir "GetHelpCmd.zip"
        $ExtractDir = Join-Path $TempDir "GetHelpCmd"
        Remove-Item $ZipPath, $ExtractDir -Recurse -Force -ErrorAction SilentlyContinue

        Write-Host "Downloading Microsoft Get Help command-line tool..."
        Invoke-WebRequest `
            -Uri "https://aka.ms/SaRA_EnterpriseVersionFiles" `
            -OutFile $ZipPath `
            -UseBasicParsing

        Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force

        $HelpCmd = Get-ChildItem $ExtractDir -Recurse -Filter "GetHelpCmd.exe" -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if (-not $HelpCmd) {
            $HelpCmd = Get-ChildItem $ExtractDir -Recurse -Filter "SaRAcmd.exe" -ErrorAction SilentlyContinue |
                Select-Object -First 1
        }
        if (-not $HelpCmd) {
            throw "GetHelpCmd.exe was not found in the Microsoft package."
        }

        $sig = Get-AuthenticodeSignature -FilePath $HelpCmd.FullName
        Write-Host "Signature status : $($sig.Status)"
        if ($sig.SignerCertificate) {
            Write-Host "Signed by        : $($sig.SignerCertificate.Subject)"
        }
        if ($sig.Status -ne "Valid") {
            throw "Microsoft Get Help digital signature is not valid."
        }
        if ($sig.SignerCertificate.Subject -notmatch "Microsoft") {
            throw "Unexpected publisher. Expected Microsoft."
        }

        Write-Host "[OK] Microsoft signature verified." -ForegroundColor Green
        Write-Host "Running: GetHelpCmd.exe -S OfficeScrubScenario -AcceptEula -OfficeVersion All"
        Write-Host "This can take several minutes..." -ForegroundColor Gray

        $scrub = Start-Process `
            -FilePath $HelpCmd.FullName `
            -ArgumentList @(
                "-S", "OfficeScrubScenario",
                "-AcceptEula",
                "-OfficeVersion", "All"
            ) `
            -WorkingDirectory $HelpCmd.DirectoryName `
            -Wait `
            -PassThru

        Write-Host "Microsoft scrub exit code: $($scrub.ExitCode)"
        # 0 = success, 68 = no Office found
        if ($scrub.ExitCode -in 0, 68) {
            $ScrubOK = $true
            Write-Host "[OK] Microsoft official Office scrub finished." -ForegroundColor Green
        }
        else {
            throw "Get Help Office scrub returned exit code $($scrub.ExitCode)."
        }
    }
    catch {
        Write-Host ""
        Write-Host "[FAIL] Microsoft official scrub" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}


# ================================================================
# LEFTOVER PROGRAM FILES
# ================================================================

if ($RemoveLeftovers) {

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "REMOVE LEFTOVER OFFICE PROGRAM FILES" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {
        $paths = @(
            "$env:ProgramFiles\Microsoft Office",
            "${env:ProgramFiles(x86)}\Microsoft Office",
            "$env:ProgramFiles\Microsoft Office 15",
            "${env:ProgramFiles(x86)}\Microsoft Office 15",
            "$env:ProgramFiles\Microsoft Office 16",
            "${env:ProgramFiles(x86)}\Microsoft Office 16",
            "$env:CommonProgramFiles\Microsoft Shared\ClickToRun",
            "${env:CommonProgramFiles(x86)}\Microsoft Shared\ClickToRun"
        )

        foreach ($p in $paths) {
            if (Test-Path $p) {
                Write-Host "Removing: $p"
                Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue
            }
        }

        $LeftoversOK = $true
        Write-Host "[OK] Leftover program folders cleaned." -ForegroundColor Green
        Write-Host "User documents and Outlook PST files were not deleted." -ForegroundColor Gray
    }
    catch {
        Write-Host ""
        Write-Host "[FAIL] Leftover cleanup" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}


# ================================================================
# CLEANUP + RESULT
# ================================================================

Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue

$Remaining = @(Get-InstalledOfficeProducts)

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " FINAL RESULT" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

if ($UninstallClickToRun) {
    if ($ClickToRunOK) { Write-Host "[OK]   Click-to-Run / Microsoft 365 Apps" -ForegroundColor Green }
    else { Write-Host "[FAIL] Click-to-Run / Microsoft 365 Apps" -ForegroundColor Red }
}
if ($UninstallMsiOffice) {
    if ($MsiOK) { Write-Host "[OK]   MSI Office / Visio / Project" -ForegroundColor Green }
    else { Write-Host "[FAIL] MSI Office / Visio / Project" -ForegroundColor Red }
}
if ($RunMicrosoftScrub) {
    if ($ScrubOK) { Write-Host "[OK]   Microsoft official Office scrub" -ForegroundColor Green }
    else { Write-Host "[FAIL] Microsoft official Office scrub" -ForegroundColor Red }
}
if ($RemoveLeftovers) {
    if ($LeftoversOK) { Write-Host "[OK]   Leftover program files" -ForegroundColor Green }
    else { Write-Host "[FAIL] Leftover program files" -ForegroundColor Red }
}

Write-Host ""
if ($Remaining.Count -eq 0) {
    Write-Host "No Office / Microsoft 365 products remain in Uninstall registry." -ForegroundColor Green
}
else {
    Write-Host "Still listed after uninstall:" -ForegroundColor Yellow
    foreach ($p in $Remaining) {
        Write-Host "  - $($p.DisplayName)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Restart the computer to finish cleanup." -ForegroundColor Yellow
Write-Host "===================================================="
Write-Host ""
Read-Host "Press ENTER to close"
