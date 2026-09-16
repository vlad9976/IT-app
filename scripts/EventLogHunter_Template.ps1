# Event Log Hunter - Human-readable output
$idsRaw = '{{event_ids}}'.Trim()
if (-not $idsRaw) { Write-Warning 'Enter Event IDs or use a preset.'; exit 1 }
$ids = $idsRaw -split ',' | ForEach-Object { $t = $_.Trim(); if ($t) { [int]$t } } | Where-Object { $_ }
$start = (Get-Date).AddHours(-[int]'{{hours}}')

$eventNames = @{
  4624='Successful Logon'; 4625='Failed Logon'; 4634='Logoff'; 4648='RunAs Logon'
  4672='Admin Privileges Assigned'; 4673='Privilege Used'
  4720='User Account Created'; 4722='User Enabled'; 4724='Password Reset'; 4725='User Disabled'; 4726='User Deleted'; 4740='Account Locked Out'; 4767='Account Unlocked'
  4732='Member Added to Local Group'; 4733='Member Removed from Local Group'; 4728='Member Added to Global Group'; 4756='Member Added to Universal Group'
  4688='Process Created'; 4689='Process Terminated'
  4697='Service Installed'; 4698='Scheduled Task Created'; 4699='Scheduled Task Deleted'; 4702='Scheduled Task Updated'
  4616='System Time Changed'; 4719='Audit Policy Changed'; 4608='Windows Starting'
  6008='Unexpected Shutdown'; 1074='Shutdown Initiated'; 41='Kernel Power (unexpected loss)'
  4656='Object Handle Requested'; 4663='Object Accessed'; 4660='Object Deleted'
  1001='Blue Screen / WER'; 5140='Network Share Accessed'
}

try {
  $events = Get-WinEvent -FilterHashtable @{ LogName='{{log_name}}'; Id=$ids; StartTime=$start } -MaxEvents 5000 -ErrorAction Stop
  $count = $events.Count
  Write-Host "`n  Found $count event(s) in {{log_name}} (last {{hours}} hours)`n" -ForegroundColor Cyan

  $i = 1
  foreach ($e in $events) {
    $time = $e.TimeCreated.ToString('yyyy-MM-dd  HH:mm:ss')
    $name = if ($eventNames[$e.Id]) { " - $($eventNames[$e.Id])" } else { '' }
    Write-Host ('=' * 70) -ForegroundColor DarkGray
    Write-Host "  [$i]  $time" -ForegroundColor Gray
    Write-Host "  Event ID $($e.Id)$name" -ForegroundColor Cyan
    Write-Host "  Level: $($e.LevelDisplayName)" -ForegroundColor DarkYellow
    # Use only the first line (avoids the massive Subject:/Logon Info/etc. block)
    $raw = if ($e.Message) { $e.Message } else { '(no message)' }
    $lines = $raw -split "`r`n|`n"
    $summary = ($lines | Where-Object { $_.Trim().Length -gt 0 } | Select-Object -First 1)
    if (-not $summary) { $summary = $raw }
    $summary = ($summary -replace '\s+', ' ').Trim()
    if ($summary.Length -gt 350) { $summary = $summary.Substring(0,347) + '...' }
    Write-Host "  Summary: $summary" -ForegroundColor White
    Write-Host ""
    $i++
  }
  Write-Host ('=' * 70) -ForegroundColor DarkGray
  Write-Host "  End of report ($count event(s))`n" -ForegroundColor Cyan
} catch {
  if ($_.Exception.Message -match 'No events were found') {
    Write-Host "`n  No events found in the specified time range." -ForegroundColor Yellow
    Write-Host "  Try a longer time range, different Event IDs, or run as Administrator for Security log.`n" -ForegroundColor Gray
  } else { Write-Warning $_.Exception.Message }
}
