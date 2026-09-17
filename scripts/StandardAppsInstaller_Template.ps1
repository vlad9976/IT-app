# ================================================================
# STANDARD APPS INSTALLER
# Google Chrome + Adobe Acrobat Reader 64-bit + WinRAR + Microsoft 365 Apps (Hebrew)
#
# No WinGet required
# Run as Administrator
# ================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$InstallChrome     = ('{{InstallChrome}}' -eq 'true')
$InstallAdobe      = ('{{InstallAdobe}}' -eq 'true')
$InstallWinRAR     = ('{{InstallWinRAR}}' -eq 'true')
$InstallOffice365  = ('{{InstallOffice365}}' -eq 'true')

$TempDir = Join-Path $env:TEMP "StandardAppsInstaller"

New-Item `
    -Path $TempDir `
    -ItemType Directory `
    -Force `
    -ErrorAction SilentlyContinue | Out-Null


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


if (-not ($InstallChrome -or $InstallAdobe -or $InstallWinRAR -or $InstallOffice365)) {

    Write-Host ""
    Write-Host "No applications selected. Check at least one app and generate the script again." -ForegroundColor Yellow
    Write-Host ""

    Read-Host "Press ENTER to close"
    return
}


# ================================================================
# TLS
# ================================================================

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12


# ================================================================
# FUNCTIONS
# ================================================================

function Test-VendorSignature {

    param(
        [string]$File,
        [string]$Vendor
    )

    if (-not (Test-Path $File)) {
        throw "File not found: $File"
    }

    $Signature = Get-AuthenticodeSignature -FilePath $File

    Write-Host "Signature status : $($Signature.Status)"

    if ($Signature.SignerCertificate) {
        Write-Host "Signed by        : $($Signature.SignerCertificate.Subject)"
    }

    if ($Signature.Status -ne "Valid") {
        throw "Digital signature is not valid."
    }

    if ($Signature.SignerCertificate.Subject -notmatch $Vendor) {
        throw "Unexpected publisher. Expected: $Vendor"
    }

    return $true
}


function Test-ChromeInstalled {

    return (
        (Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe") -or
        (Test-Path "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe")
    )
}


function Test-AdobeInstalled {

    $Adobe = Get-ItemProperty `
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*", `
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" `
        -ErrorAction SilentlyContinue |
        Where-Object {
            $_.DisplayName -match "^Adobe Acrobat" -or
            $_.DisplayName -match "^Adobe Reader"
        } |
        Select-Object -First 1

    return ($null -ne $Adobe)
}


function Test-WinRARInstalled {

    return (
        (Test-Path "C:\Program Files\WinRAR\WinRAR.exe") -or
        (Test-Path "C:\Program Files (x86)\WinRAR\WinRAR.exe")
    )
}


function Test-Office365Installed {

    $Word = @(
        "$env:ProgramFiles\Microsoft Office\root\Office16\WINWORD.EXE",
        "${env:ProgramFiles(x86)}\Microsoft Office\root\Office16\WINWORD.EXE",
        "$env:ProgramFiles\Microsoft Office\Office16\WINWORD.EXE",
        "${env:ProgramFiles(x86)}\Microsoft Office\Office16\WINWORD.EXE"
    ) | Where-Object { Test-Path $_ }

    if ($Word) { return $true }

    $Office = Get-ItemProperty `
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*", `
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" `
        -ErrorAction SilentlyContinue |
        Where-Object {
            $_.DisplayName -match 'Microsoft 365' -or
            $_.DisplayName -match 'Microsoft365' -or
            $_.DisplayName -match 'Office 365' -or
            $_.DisplayName -match 'יישומי Microsoft' -or
            $_.DisplayName -match 'Microsoft Office'
        } |
        Select-Object -First 1

    return ($null -ne $Office)
}


# ================================================================
# RESULTS
# ================================================================

$ChromeOK = $false
$AdobeOK  = $false
$WinRAROK = $false
$Office365OK = $false

$Total = @($InstallChrome, $InstallAdobe, $InstallWinRAR, $InstallOffice365) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count
$Step = 0


$SelectedNames = @()
if ($InstallChrome)    { $SelectedNames += 'Chrome' }
if ($InstallAdobe)     { $SelectedNames += 'Acrobat Reader' }
if ($InstallWinRAR)    { $SelectedNames += 'WinRAR' }
if ($InstallOffice365) { $SelectedNames += 'Microsoft 365 Apps (Hebrew)' }

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " STANDARD APPLICATION INSTALLER" -ForegroundColor Cyan
Write-Host " Selected: $($SelectedNames -join ' + ')" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan


# ================================================================
# GOOGLE CHROME
# ================================================================

if ($InstallChrome) {

    $Step++

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "[$Step/$Total] GOOGLE CHROME" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {

        if (Test-ChromeInstalled) {

            Write-Host "Chrome is already installed." -ForegroundColor Green
            $ChromeOK = $true

        }
        else {

            $ChromeURL = "https://dl.google.com/dl/chrome/install/googlechromestandaloneenterprise64.msi"
            $ChromeMSI = Join-Path $TempDir "GoogleChromeEnterprise64.msi"

            Remove-Item $ChromeMSI -Force -ErrorAction SilentlyContinue

            Write-Host "Downloading Chrome from Google..."

            Invoke-WebRequest `
                -Uri $ChromeURL `
                -OutFile $ChromeMSI `
                -UseBasicParsing

            Write-Host "Checking Google digital signature..."

            Test-VendorSignature `
                -File $ChromeMSI `
                -Vendor "Google" | Out-Null

            Write-Host "[OK] Google signature verified." -ForegroundColor Green
            Write-Host "Installing Chrome..."

            $ChromeProcess = Start-Process `
                -FilePath "msiexec.exe" `
                -ArgumentList @(
                    "/i"
                    "`"$ChromeMSI`""
                    "/qn"
                    "/norestart"
                ) `
                -Wait `
                -PassThru

            Write-Host "Installer exit code: $($ChromeProcess.ExitCode)"

            Start-Sleep -Seconds 3

            if (Test-ChromeInstalled) {

                $ChromeOK = $true
                Write-Host "[OK] Google Chrome installed." -ForegroundColor Green

            }
            else {

                throw "Chrome installation finished but Chrome was not detected."
            }
        }

    }
    catch {

        Write-Host ""
        Write-Host "[FAIL] Chrome" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}


# ================================================================
# ADOBE ACROBAT READER
# ================================================================

if ($InstallAdobe) {

    $Step++

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "[$Step/$Total] ADOBE ACROBAT READER 64-BIT" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {

        if (Test-AdobeInstalled) {

            Write-Host "Adobe Acrobat/Reader is already installed." -ForegroundColor Green
            $AdobeOK = $true

        }
        else {

            Write-Host "Getting latest Adobe Reader version..."

            $AdobeAPI = `
                "https://rdc.adobe.io/reader/products?lang=mui&site=enterprise&os=Windows%2011&api_key=dc-get-adobereader-cdn"

            $AdobeData = Invoke-RestMethod `
                -Uri $AdobeAPI `
                -UseBasicParsing

            $Reader64 = $AdobeData.products.reader |
                Where-Object {
                    $_.displayName -match "64"
                } |
                Select-Object -First 1

            if (-not $Reader64) {

                # Fallback if Adobe changes displayName
                $Reader64 = $AdobeData.products.reader |
                    Select-Object -First 1
            }

            if (-not $Reader64.version) {
                throw "Could not determine Adobe Reader version."
            }

            $AdobeVersionText = $Reader64.version
            $AdobeVersion = $AdobeVersionText.Replace(".", "")

            Write-Host "Adobe Reader version: $AdobeVersionText"

            $AdobeURL = `
                "https://ardownload2.adobe.com/pub/adobe/acrobat/win/AcrobatDC/$AdobeVersion/AcroRdrDCx64${AdobeVersion}_MUI.exe"

            $AdobeEXE = Join-Path `
                $TempDir `
                "AdobeReader64.exe"

            Remove-Item $AdobeEXE -Force -ErrorAction SilentlyContinue

            Write-Host "Downloading Adobe Reader..."

            Invoke-WebRequest `
                -Uri $AdobeURL `
                -OutFile $AdobeEXE `
                -UseBasicParsing

            Write-Host "Checking Adobe digital signature..."

            Test-VendorSignature `
                -File $AdobeEXE `
                -Vendor "Adobe" | Out-Null

            Write-Host "[OK] Adobe signature verified." -ForegroundColor Green

            Write-Host "Installing Adobe Reader..."

            $AdobeProcess = Start-Process `
                -FilePath $AdobeEXE `
                -ArgumentList @(
                    "/sAll"
                    "/rs"
                    "/rps"
                    "/msi"
                    "/norestart"
                    "/quiet"
                    "EULA_ACCEPT=YES"
                ) `
                -Wait `
                -PassThru

            Write-Host "Installer exit code: $($AdobeProcess.ExitCode)"

            Start-Sleep -Seconds 5

            if (Test-AdobeInstalled) {

                $AdobeOK = $true
                Write-Host "[OK] Adobe Acrobat Reader installed." -ForegroundColor Green

            }
            else {

                throw "Adobe installer finished but Acrobat Reader was not detected."
            }
        }

    }
    catch {

        Write-Host ""
        Write-Host "[FAIL] Adobe Acrobat Reader" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}


# ================================================================
# WINRAR
# ================================================================

if ($InstallWinRAR) {

    $Step++

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "[$Step/$Total] WINRAR" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {

        if (Test-WinRARInstalled) {

            Write-Host "WinRAR is already installed." -ForegroundColor Green
            $WinRAROK = $true

        }
        else {

            Write-Host "Finding latest stable WinRAR..."

            $RARPage = Invoke-WebRequest `
                -Uri "https://www.rarlab.com/download.htm" `
                -UseBasicParsing

            $RARLink = $RARPage.Links |
                Where-Object {
                    $_.href -match 'winrar-x64-[0-9]+\.exe$'
                } |
                Select-Object -First 1

            if (-not $RARLink) {
                throw "Could not find stable WinRAR x64 download."
            }

            $RARHref = $RARLink.href

            if ($RARHref -match "^https?://") {

                $RARUrl = $RARHref

            }
            else {

                $RARUrl = "https://www.rarlab.com/" + $RARHref.TrimStart("/")
            }

            Write-Host "Download: $RARUrl"

            $RARExe = Join-Path $TempDir "WinRAR-x64.exe"

            Remove-Item $RARExe -Force -ErrorAction SilentlyContinue

            Write-Host "Downloading WinRAR..."

            Invoke-WebRequest `
                -Uri $RARUrl `
                -OutFile $RARExe `
                -UseBasicParsing

            Write-Host "Checking WinRAR digital signature..."

            Test-VendorSignature `
                -File $RARExe `
                -Vendor "win\.rar|RARLAB|Alexander Roshal" | Out-Null

            Write-Host "[OK] WinRAR signature verified." -ForegroundColor Green
            Write-Host "Installing WinRAR..."

            $RARProcess = Start-Process `
                -FilePath $RARExe `
                -ArgumentList "/S" `
                -Wait `
                -PassThru

            Write-Host "Installer exit code: $($RARProcess.ExitCode)"

            Start-Sleep -Seconds 3

            if (Test-WinRARInstalled) {

                $WinRAROK = $true
                Write-Host "[OK] WinRAR installed." -ForegroundColor Green

            }
            else {

                throw "WinRAR installation finished but WinRAR was not detected."
            }
        }

    }
    catch {

        Write-Host ""
        Write-Host "[FAIL] WinRAR" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}


# ================================================================
# MICROSOFT 365 APPS (HEBREW)
# ================================================================

if ($InstallOffice365) {

    $Step++

    Write-Host ""
    Write-Host "===================================================="
    Write-Host "[$Step/$Total] MICROSOFT 365 APPS (HEBREW he-il)" -ForegroundColor Yellow
    Write-Host "===================================================="

    try {

        if (Test-Office365Installed) {

            Write-Host "Microsoft 365 / Office is already installed." -ForegroundColor Green
            $Office365OK = $true

        }
        else {

            $OdtExe = Join-Path $TempDir "officedeploymenttool.exe"
            $OdtDir = Join-Path $TempDir "ODT"
            Remove-Item $OdtExe, $OdtDir -Recurse -Force -ErrorAction SilentlyContinue
            New-Item -Path $OdtDir -ItemType Directory -Force | Out-Null

            Write-Host "Downloading Microsoft Office Deployment Tool..."

            Invoke-WebRequest `
                -Uri "https://aka.ms/ODT" `
                -OutFile $OdtExe `
                -UseBasicParsing

            Write-Host "Checking Microsoft digital signature..."

            Test-VendorSignature `
                -File $OdtExe `
                -Vendor "Microsoft" | Out-Null

            Write-Host "[OK] Microsoft signature verified." -ForegroundColor Green
            Write-Host "Extracting Office Deployment Tool..."

            $Extract = Start-Process `
                -FilePath $OdtExe `
                -ArgumentList @("/quiet", "/extract:$OdtDir") `
                -Wait `
                -PassThru

            Write-Host "ODT extract exit code: $($Extract.ExitCode)"

            $Setup = Get-ChildItem $OdtDir -Filter "setup.exe" -Recurse -ErrorAction SilentlyContinue |
                Select-Object -First 1

            if (-not $Setup) {
                throw "ODT setup.exe was not found after extract."
            }

            Test-VendorSignature `
                -File $Setup.FullName `
                -Vendor "Microsoft" | Out-Null

            $ConfigXml = @"
<Configuration>
  <Add OfficeClientEdition="64" Channel="Current">
    <Product ID="O365ProPlusRetail">
      <Language ID="he-il" />
    </Product>
  </Add>
  <Display Level="None" AcceptEULA="TRUE" />
  <Property Name="FORCEAPPSHUTDOWN" Value="TRUE" />
  <Updates Enabled="TRUE" />
</Configuration>
"@

            $ConfigPath = Join-Path $OdtDir "install-m365-he-il.xml"
            $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($ConfigPath, $ConfigXml, $Utf8NoBom)

            Write-Host "Installing Microsoft 365 Apps (Hebrew he-il)..."
            Write-Host "This can take several minutes..." -ForegroundColor Gray

            $OfficeProcess = Start-Process `
                -FilePath $Setup.FullName `
                -ArgumentList @("/configure", "`"$ConfigPath`"") `
                -Wait `
                -PassThru

            Write-Host "Installer exit code: $($OfficeProcess.ExitCode)"

            Start-Sleep -Seconds 5

            if (Test-Office365Installed) {

                $Office365OK = $true
                Write-Host "[OK] Microsoft 365 Apps installed (Hebrew)." -ForegroundColor Green

            }
            else {

                throw "Office installer finished but Microsoft 365 / Office was not detected."
            }
        }

    }
    catch {

        Write-Host ""
        Write-Host "[FAIL] Microsoft 365 Apps" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}


# ================================================================
# CLEANUP
# ================================================================

Remove-Item `
    $TempDir `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue


# ================================================================
# FINAL VERIFICATION
# ================================================================

Write-Host ""
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " FINAL RESULT" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$AllSelectedOk = $true

if ($InstallChrome) {
    if ($ChromeOK) {
        Write-Host "[OK]   Google Chrome" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Google Chrome" -ForegroundColor Red
        $AllSelectedOk = $false
    }
}

if ($InstallAdobe) {
    if ($AdobeOK) {
        Write-Host "[OK]   Adobe Acrobat Reader" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Adobe Acrobat Reader" -ForegroundColor Red
        $AllSelectedOk = $false
    }
}

if ($InstallWinRAR) {
    if ($WinRAROK) {
        Write-Host "[OK]   WinRAR" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] WinRAR" -ForegroundColor Red
        $AllSelectedOk = $false
    }
}

if ($InstallOffice365) {
    if ($Office365OK) {
        Write-Host "[OK]   Microsoft 365 Apps (Hebrew)" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Microsoft 365 Apps (Hebrew)" -ForegroundColor Red
        $AllSelectedOk = $false
    }
}

Write-Host "===================================================="

if ($AllSelectedOk) {

    Write-Host ""
    Write-Host "ALL SELECTED APPLICATIONS INSTALLED SUCCESSFULLY." -ForegroundColor Green

}
else {

    Write-Host ""
    Write-Host "One or more selected applications failed." -ForegroundColor Yellow
    Write-Host "Check the error shown above." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press ENTER to close"
