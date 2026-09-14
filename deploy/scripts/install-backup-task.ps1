# B-BACKUP + D-DISK.1 — install 22:00 dump and hourly disk-status Task Scheduler jobs
# Run once on the server PC (re-run after moving the repo):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\install-backup-task.ps1
# Optional first dump now:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\install-backup-task.ps1 -RunOnce

param(
    [switch]$RunOnce
)

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
$vbs = Join-Path $scriptsDir "backup-diemdanh-db.vbs"
$ps1 = Join-Path $scriptsDir "backup-diemdanh-db.ps1"
$cfgExample = Join-Path $scriptsDir "backup.env.example"
$cfgPath = Join-Path $scriptsDir "backup.env"

if (-not (Test-Path $vbs)) {
    throw "Missing backup-diemdanh-db.vbs at $vbs"
}
if (-not (Test-Path $ps1)) {
    throw "Missing backup-diemdanh-db.ps1 at $ps1"
}
if (-not (Test-Path $cfgPath)) {
    Copy-Item $cfgExample $cfgPath
    Write-Host "Created $cfgPath - set DB_PASS then re-run this script."
    exit 1
}

$taskName = "BV87-DiemDanh-DB-Backup"
$diskTaskName = "BV87-DiemDanh-Disk-Status"
$diskVbs = Join-Path $scriptsDir "write-disk-status.vbs"
$diskPs1 = Join-Path $scriptsDir "write-disk-status.ps1"
$tr = "wscript.exe //B `"$vbs`""
$diskTr = "wscript.exe //B `"$diskVbs`""
$userId = if ($env:USERDOMAIN) { "$env:USERDOMAIN\$env:USERNAME" } else { $env:USERNAME }

if (-not (Test-Path $diskVbs)) {
    throw "Missing write-disk-status.vbs at $diskVbs"
}
if (-not (Test-Path $diskPs1)) {
    throw "Missing write-disk-status.ps1 at $diskPs1"
}

function Show-AccessDeniedHelp {
    param([string]$Name = $taskName)
    Write-Host ""
    Write-Host "Access denied when changing scheduled task $Name."
    Write-Host "Do ONE of the following, then re-run this script:"
    Write-Host "  1. Task Scheduler - find the task - Delete"
    Write-Host "  2. Right-click PowerShell - Run as administrator - run this script again"
    Write-Host ""
}

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

$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "//B `"$vbs`""
$trigger = New-ScheduledTaskTrigger -Daily -At "22:00"
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
        "/SC", "DAILY", "/ST", "22:00", "/RL", "LIMITED", "/IT", "/RU", $env:USERNAME
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

$verify = Invoke-Schtasks -ArgumentList @("/Query", "/TN", $taskName, "/V", "/FO", "LIST")
if ($verify.Text -notmatch "backup-diemdanh-db\.vbs") {
    Write-Host "WARNING: task exists but may still point at old action."
    Write-Host $verify.Text
    Show-AccessDeniedHelp
    exit 1
}

Write-Host "Action: wscript //B backup-diemdanh-db.vbs (no PowerShell flash)."
Write-Host "Runs daily at 22:00 for user $userId (PC local time)."
Write-Host "Dumps: repo\backup\backup_ddMMyyyy\ (keep 7 days)."
Write-Host "Edit DB_PASS in: $cfgPath"
Write-Host "Test now:  powershell -NoProfile -ExecutionPolicy Bypass -File `"$ps1`""

$diskDel = Invoke-Schtasks -ArgumentList @("/Delete", "/TN", $diskTaskName, "/F")
if ($diskDel.ExitCode -ne 0 -and -not (Test-TaskMissingMessage $diskDel.Text)) {
    Write-Host "schtasks /Delete: $($diskDel.Text)"
}

$existingDisk = Get-ScheduledTask -TaskName $diskTaskName -ErrorAction SilentlyContinue
if ($null -ne $existingDisk) {
    Stop-ScheduledTask -TaskName $diskTaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $diskTaskName -Confirm:$false -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 500

$diskAction = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "//B `"$diskVbs`""
$diskTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date `
    -RepetitionInterval (New-TimeSpan -Hours 1) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$diskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$diskSettings.Hidden = $true
$diskPrincipal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited

$diskRegistered = $false
try {
    Register-ScheduledTask -TaskName $diskTaskName -Action $diskAction -Trigger $diskTrigger `
        -Settings $diskSettings -Principal $diskPrincipal | Out-Null
    Write-Host "Registered scheduled task: $diskTaskName"
    $diskRegistered = $true
} catch {
    Write-Host "CIM Register failed: $($_.Exception.Message)"
    Write-Host "Trying schtasks /Create /F ..."
    $createDisk = Invoke-Schtasks -ArgumentList @(
        "/Create", "/F", "/TN", $diskTaskName, "/TR", $diskTr,
        "/SC", "HOURLY", "/RL", "LIMITED", "/IT", "/RU", $env:USERNAME
    )
    if ($createDisk.ExitCode -ne 0) {
        Write-Host $createDisk.Text
        Show-AccessDeniedHelp -Name $diskTaskName
        exit 1
    }
    Write-Host "Registered scheduled task via schtasks: $diskTaskName"
    $diskRegistered = $true
}

if (-not $diskRegistered) {
    Show-AccessDeniedHelp -Name $diskTaskName
    exit 1
}

$verifyDisk = Invoke-Schtasks -ArgumentList @("/Query", "/TN", $diskTaskName, "/V", "/FO", "LIST")
if ($verifyDisk.Text -notmatch "write-disk-status\.vbs") {
    Write-Host "WARNING: disk task exists but may still point at old action."
    Write-Host $verifyDisk.Text
    Show-AccessDeniedHelp -Name $diskTaskName
    exit 1
}

Write-Host "Disk status: hourly write-disk-status.vbs -> repo\backup\disk-status.json"

try {
    & $diskPs1
    Write-Host "Wrote disk-status.json now."
} catch {
    Write-Host "WARNING: could not write disk-status.json now: $($_.Exception.Message)"
}

if ($RunOnce) {
    Write-Host "Running first dump now..."
    & $ps1
    exit $LASTEXITCODE
}
