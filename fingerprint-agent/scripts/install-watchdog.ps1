# P4 section 9.5.3 - install Task Scheduler watchdog (every 2 minutes, current user)
# Run once (re-run after VBS/PID changes):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\install-watchdog.ps1
# Prefer Run as administrator if Access denied.
# Safe if task was already deleted (schtasks /Delete "not found" is ignored).

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
$vbs = Join-Path $scriptsDir "watchdog-agent.vbs"
if (-not (Test-Path $vbs)) {
    throw "Missing watchdog-agent.vbs at $vbs"
}

$taskName = "BV87-Fingerprint-Agent-Watchdog"
$tr = "wscript.exe //B `"$vbs`""
$userId = if ($env:USERDOMAIN) { "$env:USERDOMAIN\$env:USERNAME" } else { $env:USERNAME }

function Show-AccessDeniedHelp {
    Write-Host ""
    Write-Host "Access denied when changing scheduled task '$taskName'."
    Write-Host "Do ONE of the following, then re-run this script:"
    Write-Host "  1) Task Scheduler -> find '$taskName' -> Delete"
    Write-Host "  2) Right-click PowerShell -> Run as administrator -> run this script again"
    Write-Host ""
}

# Native schtasks writes ERROR to stderr; with ErrorActionPreference=Stop that becomes terminating.
# Always capture without stopping the script.
function Invoke-Schtasks {
    param([Parameter(Mandatory = $true)][string[]]$ArgumentList)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = & schtasks.exe @ArgumentList 2>&1
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    return [pscustomobject]@{
        ExitCode = $code
        Text     = (($output | ForEach-Object { "$_" }) -join "`n").Trim()
    }
}

function Test-TaskMissingMessage {
    param([string]$Text)
    return ($Text -match "cannot find|does not exist|cannot find the file specified|ERROR: The system cannot find")
}

# 1) Best-effort delete (OK if task already gone)
$del = Invoke-Schtasks -ArgumentList @("/Delete", "/TN", $taskName, "/F")
if ($del.ExitCode -ne 0 -and -not (Test-TaskMissingMessage $del.Text)) {
    Write-Host "schtasks /Delete: $($del.Text)"
}

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($null -ne $existing) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 500

# 2) Register via CIM
$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "//B `"$vbs`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date `
    -RepetitionInterval (New-TimeSpan -Minutes 2) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$settings.Hidden = $true
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited

$registered = $false
try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
        -Settings $settings -Principal $principal | Out-Null
    Write-Host "Registered scheduled task: $taskName"
    $registered = $true
} catch {
    Write-Host "CIM Register failed: $($_.Exception.Message)"
    Write-Host "Trying schtasks /Create /F ..."
    $create = Invoke-Schtasks -ArgumentList @(
        "/Create", "/F", "/TN", $taskName, "/TR", $tr,
        "/SC", "MINUTE", "/MO", "2", "/RL", "LIMITED", "/IT", "/RU", $env:USERNAME
    )
    if ($create.ExitCode -ne 0) {
        Write-Host $create.Text
        Show-AccessDeniedHelp
        exit 1
    }
    Write-Host "Registered scheduled task via schtasks: $taskName"
    $registered = $true
}

if (-not $registered) {
    Show-AccessDeniedHelp
    exit 1
}

# Verify action points at VBS
$verify = Invoke-Schtasks -ArgumentList @("/Query", "/TN", $taskName, "/V", "/FO", "LIST")
if ($verify.Text -notmatch "watchdog-agent\.vbs") {
    Write-Host "WARNING: task exists but may still point at old powershell action."
    Write-Host $verify.Text
    Show-AccessDeniedHelp
    exit 1
}

Write-Host "Action: wscript //B watchdog-agent.vbs (no PowerShell flash)."
Write-Host "Runs every 2 minutes for user $userId."
Write-Host "Also run install-autostart.ps1 so Agent starts at Windows logon."
Write-Host "Not a Windows Service (no Session-0 Swing UI)."
Write-Host "Debug with console: scripts\start-agent.bat"
