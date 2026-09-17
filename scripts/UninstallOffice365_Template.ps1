# ================================================================
# UNINSTALL MICROSOFT 365 / OFFICE
# Removes Microsoft 365 Apps and perpetual Office 2019 / 2021 / 2024 / LTSC
# in every language (he-il, en-us, ...), plus MSI, Visio, Project, Store apps.
#
# No WinGet required
# Run as Administrator
# ================================================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$UninstallClickToRun = ('{{UninstallClickToRun}}' -eq 'true')
$UninstallMsiOffice  = ('{{UninstallMsiOffice}}' -eq 'true')
$UninstallStoreOffice = ('{{UninstallStoreOffice}}' -eq 'true')
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

if (-not ($UninstallClickToRun -or $UninstallMsiOffice -or $UninstallStoreOffice -or $RunMicrosoftScrub -or $RemoveLeftovers)) {
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

    if ($Name -match 'Update for|Hotfix|Service Pack|Office OSM|Office Push Update|Click-to-Run Extensibility') {
        return $false
    }

    return (
        $Name -match 'Microsoft 365' -or
        $Name -match 'Microsoft365' -or
        $Name -match 'Office 365' -or
        $Name -match 'O365' -or
        $Name -match 'Microsoft Office' -or
        $Name -match 'יישומי Microsoft' -or
        $Name -match 'Office (16|15|19|21|24|2016|2019|2021|2024|LTSC)' -or
        $Name -match 'Click-to-Run' -or
        $Name -match 'Microsoft Visio' -or
        $Name -match 'Microsoft Project'
    )
}

function Get-UninstallRegistryProperties {
    $paths = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall'
    )

    foreach ($root in $paths) {
        if (-not (Test-Path $root)) { continue }
        Get-ChildItem $root -ErrorAction SilentlyContinue | ForEach-Object {
            Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
        }
    }
}

function Get-InstalledOfficeProducts {
    Get-UninstallRegistryProperties |
        Where-Object { Test-OfficeDisplayName $_.DisplayName } |
        Sort-Object DisplayName -Unique
}

function Get-ClickToRunExe {
    @(
        "$env:ProgramFiles\Common Files\Microsoft Shared\ClickToRun\OfficeClickToRun.exe",
        "${env:ProgramFiles(x86)}\Common Files\Microsoft Shared\ClickToRun\OfficeClickToRun.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}

function Get-ClickToRunProductRemoves {
    $removes = New-Object System.Collections.Generic.List[string]

    $cfgPath = 'HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\Configuration'
    $culture = 'en-us'
    if (Test-Path $cfgPath) {
        $cfg = Get-ItemProperty $cfgPath -ErrorAction SilentlyContinue
        if ($cfg.ClientCulture) { $culture = $cfg.ClientCulture }
        if ($cfg.ProductReleaseIds) {
            $cultures = @($culture, 'en-us', 'he-il') | Sort-Object -Unique
            foreach ($id in ($cfg.ProductReleaseIds -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
                foreach ($c in $cultures) {
                    $removes.Add("$id.16_${c}_x-none") | Out-Null
                }
            }
        }
    }

    Get-UninstallRegistryProperties | Where-Object {
        $_.UninstallString -match 'OfficeClickToRun' -or $_.QuietUninstallString -match 'OfficeClickToRun'
    } | ForEach-Object {
        if ($_.PSChildName -match '^(.+?)\s*-\s*([a-z]{2}-[a-z]{2})$') {
            $removes.Add("$($Matches[1]).16_$($Matches[2])_x-none") | Out-Null
        }
    }

    $active = 'HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\ProductReleaseIDs\Active'
    if (Test-Path $active) {
        Get-ChildItem $active -ErrorAction SilentlyContinue | ForEach-Object {
            $prod = $_.PSChildName
            if ($prod -match '^[a-z]{2}-[a-z]{2}$') { return }
            Get-ChildItem $_.PSPath -ErrorAction SilentlyContinue | ForEach-Object {
                $cult = $_.PSChildName
                if ($cult -match '^[a-z]{2}-[a-z]{2}$') {
                    $removes.Add("$prod.16_${cult}_x-none") | Out-Null
                }
            }
        }
    }

    $installedText = ((Get-InstalledOfficeProducts).DisplayName -join ' ')
    if ($installedText -match '2019|2021|2024|LTSC') {
        $knownPerpetual = @(
            'ProPlus2019Retail', 'ProPlus2019Volume', 'Standard2019Retail', 'Standard2019Volume',
            'ProPlus2021Retail', 'ProPlus2021Volume', 'Standard2021Retail', 'Standard2021Volume',
            'ProPlus2024Retail', 'ProPlus2024Volume', 'Standard2024Retail', 'Standard2024Volume',
            'HomeBusiness2019Retail', 'HomeBusiness2021Retail', 'HomeBusiness2024Retail',
            'Professional2019Retail', 'Professional2021Retail', 'Professional2024Retail'
        )
        $cultures = @($culture, 'en-us', 'he-il') | Sort-Object -Unique
        foreach ($id in $knownPerpetual) {
            foreach ($c in $cultures) {
                $removes.Add("$id.16_${c}_x-none") | Out-Null
            }
        }
    }

    $removes | Sort-Object -Unique
}

function Start-ClickToRunUninstall {
    param(
        [string]$Exe,
        [string[]]$ArgumentList
    )

    Write-Host "  OfficeClickToRun $($ArgumentList -join ' ')" -ForegroundColor Gray
    $proc = Start-Process -FilePath $Exe -ArgumentList $ArgumentList -Wait -PassThru
    Write-Host "  Exit code: $($proc.ExitCode)"
    return $proc.ExitCode
}

function Close-OfficeApps {
    $names = @(
        'WINWORD', 'EXCEL', 'POWERPNT', 'OUTLOOK', 'MSACCESS', 'MSPUB',
        'ONENOTE', 'ONENOTEM', 'VISIO', 'WINPROJ', 'LYNC', 'GROOVE',
        'MSOSYNC', 'OfficeClickToRun', 'integrator', 'olk', 'OfficeClickToRun'
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
$StoreOK = $false
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
# CLICK-TO-RUN / MICROSOFT 365 APPS (EVERY LANGUAGE)
# ================================================================

if ($UninstallClickToRun) {

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "CLICK-TO-RUN / MICROSOFT 365 APPS (ALL LANGUAGES)" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {
        $Ctr = Get-ClickToRunExe
        $productRemoves = @(Get-ClickToRunProductRemoves)

        if ($productRemoves.Count -gt 0) {
            Write-Host "Click-to-Run products to remove:" -ForegroundColor Yellow
            $productRemoves | ForEach-Object { Write-Host "  - $_" }
        }

        if ($Ctr) {
            Write-Host "Using: $Ctr"

            foreach ($prod in $productRemoves) {
                Write-Host "Uninstalling $prod ..." -ForegroundColor Yellow
                Start-ClickToRunUninstall -Exe $Ctr -ArgumentList @(
                    "scenario=install",
                    "scenariosubtype=uninstall",
                    "displaylevel=false",
                    "forceappshutdown=true",
                    "productstoremove=$prod"
                ) | Out-Null
                Start-Sleep -Seconds 2
            }

            Write-Host "Running full Click-to-Run uninstall (all remaining products)..."
            Start-ClickToRunUninstall -Exe $Ctr -ArgumentList @(
                "scenario=install",
                "scenariosubtype=uninstall",
                "displaylevel=false",
                "forceappshutdown=true"
            ) | Out-Null
        }
        else {
            Write-Host "OfficeClickToRun.exe not found yet. Will still try QuietUninstallString / ODT." -ForegroundColor Gray
        }

        $C2REntries = @(Get-UninstallRegistryProperties | Where-Object {
            Test-OfficeDisplayName $_.DisplayName -and (
                $_.QuietUninstallString -match 'OfficeClickToRun' -or
                $_.UninstallString -match 'OfficeClickToRun'
            )
        })

        foreach ($entry in $C2REntries) {
            $cmd = if ($entry.QuietUninstallString) { $entry.QuietUninstallString } else { $entry.UninstallString }
            if (-not $cmd) { continue }
            $cmd = $cmd -replace 'displaylevel=true', 'displaylevel=false'
            if ($cmd -notmatch 'displaylevel=') { $cmd += ' displaylevel=false' }
            if ($cmd -notmatch 'forceappshutdown=') { $cmd += ' forceappshutdown=true' }
            Write-Host "QuietUninstall: $($entry.DisplayName)" -ForegroundColor Yellow
            cmd /c $cmd
        }

        # Office Deployment Tool: Remove All (covers leftover en-us + he-il)
        Write-Host "Downloading Office Deployment Tool for Remove All..."
        $OdtExe = Join-Path $TempDir "officedeploymenttool.exe"
        $OdtDir = Join-Path $TempDir "ODT"
        Remove-Item $OdtExe, $OdtDir -Recurse -Force -ErrorAction SilentlyContinue
        New-Item -Path $OdtDir -ItemType Directory -Force | Out-Null

        try {
            Invoke-WebRequest -Uri "https://aka.ms/ODT" -OutFile $OdtExe -UseBasicParsing
            $odtSig = Get-AuthenticodeSignature -FilePath $OdtExe
            if ($odtSig.Status -eq 'Valid' -and $odtSig.SignerCertificate.Subject -match 'Microsoft') {
                Start-Process -FilePath $OdtExe -ArgumentList "/quiet", "/extract:$OdtDir" -Wait
                $setup = Get-ChildItem $OdtDir -Filter "setup.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($setup) {
                    $xml = @"
<Configuration>
  <Display Level="None" AcceptEULA="TRUE" />
  <Remove All="TRUE" />
</Configuration>
"@
                    $xmlPath = Join-Path $OdtDir "remove-all.xml"
                    Set-Content -Path $xmlPath -Value $xml -Encoding UTF8
                    Write-Host "Running ODT setup.exe /configure remove-all.xml"
                    $odt = Start-Process -FilePath $setup.FullName -ArgumentList "/configure", "`"$xmlPath`"" -Wait -PassThru
                    Write-Host "ODT exit code: $($odt.ExitCode)"
                }
            }
            else {
                Write-Host "ODT signature not valid. Skipping ODT." -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "ODT download/run skipped: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        $ClickToRunOK = $true
        Write-Host "[OK] Click-to-Run / Microsoft 365 uninstall steps finished." -ForegroundColor Green
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
                elseif ($prod.UninstallString -match 'msiexec') {
                    $us = ($prod.UninstallString -replace '/I', '/x' -replace '/i', '/x')
                    if ($us -notmatch '/qn') { $us += ' /qn /norestart' }
                    cmd /c $us
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
# MICROSOFT STORE OFFICE / 365 APPS
# ================================================================

if ($UninstallStoreOffice) {

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "MICROSOFT STORE OFFICE / 365 APPS" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {
        $store = @(Get-AppxPackage -AllUsers -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -match 'Microsoft\.Office|Microsoft\.MicrosoftOfficeHub|Microsoft\.Microsoft365|Microsoft\.OutlookForWindows|OfficePushNotification'
        })

        if ($store.Count -eq 0) {
            Write-Host "No Store Office / Microsoft 365 apps found." -ForegroundColor Gray
        }
        else {
            foreach ($pkg in $store) {
                Write-Host "Removing Store app: $($pkg.Name)" -ForegroundColor Yellow
                Remove-AppxPackage -Package $pkg.PackageFullName -AllUsers -ErrorAction SilentlyContinue
                Remove-AppxPackage -Package $pkg.PackageFullName -ErrorAction SilentlyContinue
            }
        }

        $prov = @(Get-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | Where-Object {
            $_.DisplayName -match 'Office|Microsoft365|MicrosoftOfficeHub|OutlookForWindows'
        })
        foreach ($pkg in $prov) {
            Write-Host "Removing provisioned app: $($pkg.DisplayName)" -ForegroundColor Yellow
            Remove-AppxProvisionedPackage -Online -PackageName $pkg.PackageName -ErrorAction SilentlyContinue | Out-Null
        }

        $StoreOK = $true
        Write-Host "[OK] Store Office / Microsoft 365 apps cleanup finished." -ForegroundColor Green
    }
    catch {
        Write-Host ""
        Write-Host "[FAIL] Store Office uninstall" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}


# ================================================================
# MICROSOFT OFFICIAL SCRUB
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

        foreach ($ver in @('M365', '2024', '2021', '2019', 'All')) {
            Write-Host "Running: GetHelpCmd.exe -S OfficeScrubScenario -AcceptEula -OfficeVersion $ver"
            $scrub = Start-Process `
                -FilePath $HelpCmd.FullName `
                -ArgumentList @(
                    "-S", "OfficeScrubScenario",
                    "-AcceptEula",
                    "-OfficeVersion", $ver
                ) `
                -WorkingDirectory $HelpCmd.DirectoryName `
                -Wait `
                -PassThru
            Write-Host "Scrub $ver exit code: $($scrub.ExitCode)"
            # 0 = success, 68 = none found, 66 = that version not installed
            if ($scrub.ExitCode -notin 0, 66, 68) {
                Write-Host "  Warning: scrub $ver returned $($scrub.ExitCode)" -ForegroundColor Yellow
            }
        }

        $ScrubOK = $true
        Write-Host "[OK] Microsoft official Office scrub finished." -ForegroundColor Green
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
if ($UninstallStoreOffice) {
    if ($StoreOK) { Write-Host "[OK]   Store Office / Microsoft 365 apps" -ForegroundColor Green }
    else { Write-Host "[FAIL] Store Office / Microsoft 365 apps" -ForegroundColor Red }
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
    Write-Host "Restart and run the script again if they remain." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Restart the computer to finish cleanup." -ForegroundColor Yellow
Write-Host "===================================================="
Write-Host ""
Read-Host "Press ENTER to close"
