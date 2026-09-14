# D-DISK.1 — write backup\disk-status.json from the host Windows drive (not Docker WSL disk).
# Called hourly (Task Scheduler) and after the 22:00 dump.

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
$deployDir = Split-Path -Parent $scriptsDir
$repoRoot = Split-Path -Parent $deployDir
$backupRoot = Join-Path $repoRoot "backup"
$diskStatusPath = Join-Path $backupRoot "disk-status.json"
$retentionDays = 7

function Import-EnvFile {
    param([string]$Path, [hashtable]$Target)
    if (-not (Test-Path $Path)) {
        return
    }
    foreach ($raw in Get-Content -Path $Path -Encoding UTF8) {
        $line = $raw.Trim()
        if ($line.Length -eq 0 -or $line.StartsWith("#")) {
            continue
        }
        $eq = $line.IndexOf("=")
        if ($eq -le 0) {
            continue
        }
        $key = $line.Substring(0, $eq).Trim()
        $value = $line.Substring($eq + 1).Trim()
        if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $Target[$key] = $value
    }
}

$cfg = @{}
Import-EnvFile -Path (Join-Path $deployDir ".env") -Target $cfg
Import-EnvFile -Path (Join-Path $scriptsDir "backup.env") -Target $cfg
if ($cfg.ContainsKey("RETENTION_DAYS")) {
    $parsedRetention = 0
    if ([int]::TryParse($cfg["RETENTION_DAYS"], [ref]$parsedRetention) -and $parsedRetention -ge 1) {
        $retentionDays = $parsedRetention
    }
}

if (-not (Test-Path $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
}

$driveLetter = [System.IO.Path]::GetPathRoot($backupRoot).Substring(0, 1)
$drive = Get-PSDrive -Name $driveLetter -ErrorAction SilentlyContinue
if ($null -eq $drive) {
    throw "Drive $driveLetter not found."
}

$total = [int64]$drive.Used + [int64]$drive.Free
$freePct = 0
if ($total -gt 0) {
    $freePct = [math]::Round(100.0 * [double]$drive.Free / [double]$total, 1)
}

$payload = [ordered]@{
    checkedAt     = (Get-Date).ToString("o")
    drive         = ($driveLetter + ":")
    totalBytes    = $total
    freeBytes     = [int64]$drive.Free
    usedBytes     = [int64]$drive.Used
    freePercent   = $freePct
    backupRoot    = $backupRoot
    retentionDays = $retentionDays
}
$json = $payload | ConvertTo-Json -Compress
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($diskStatusPath, $json, $utf8)
