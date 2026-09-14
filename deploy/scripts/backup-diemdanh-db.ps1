# B-BACKUP — dump diemdanhngay_bv87_db to backup\backup_ddMMyyyy\ (22:00 Task Scheduler)
# Run on Windows MySQL host. Do not run inside the Spring Docker container.

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
$deployDir = Split-Path -Parent $scriptsDir
$repoRoot = Split-Path -Parent $deployDir
$backupRoot = Join-Path $repoRoot "backup"
$stamp = Get-Date -Format "ddMMyyyy"
$dayDir = Join-Path $backupRoot ("backup_" + $stamp)
$logPath = Join-Path $dayDir "backup.log"
$gzPath = Join-Path $dayDir "diemdanhngay_bv87_db.sql.gz"
$diskStatusPath = Join-Path $backupRoot "disk-status.json"

function Write-BackupLog {
    param([string]$Message)
    $line = "{0} {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    if (-not (Test-Path $dayDir)) {
        New-Item -ItemType Directory -Path $dayDir -Force | Out-Null
    }
    Add-Content -Path $logPath -Value $line -Encoding UTF8
}

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

function Resolve-MysqlDump {
    param([string]$Configured)
    if (-not [string]::IsNullOrWhiteSpace($Configured) -and (Test-Path -LiteralPath $Configured)) {
        return $Configured
    }
    $cmd = Get-Command mysqldump.exe -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }
    $roots = @(
        "${env:ProgramFiles}\MySQL",
        "${env:ProgramFiles(x86)}\MySQL",
        "C:\xampp\mysql\bin\mysqldump.exe"
    )
    foreach ($root in $roots) {
        if ($root.EndsWith("mysqldump.exe")) {
            if (Test-Path $root) { return $root }
            continue
        }
        if (-not (Test-Path $root)) { continue }
        $found = Get-ChildItem -Path $root -Filter mysqldump.exe -Recurse -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($found) {
            return $found.FullName
        }
    }
    return $null
}

function Compress-GzipFile {
    param([string]$Source, [string]$Destination)
    $inStream = [System.IO.File]::OpenRead($Source)
    try {
        $outStream = [System.IO.File]::Create($Destination)
        try {
            $gzip = New-Object System.IO.Compression.GZipStream(
                $outStream,
                [System.IO.Compression.CompressionMode]::Compress)
            try {
                $inStream.CopyTo($gzip)
            } finally {
                $gzip.Dispose()
            }
        } finally {
            $outStream.Dispose()
        }
    } finally {
        $inStream.Dispose()
    }
}

function Invoke-WriteDiskStatus {
    $writeScript = Join-Path $scriptsDir "write-disk-status.ps1"
    if (-not (Test-Path $writeScript)) {
        Write-BackupLog "WARN: missing write-disk-status.ps1"
        return
    }
    try {
        & $writeScript
        Write-BackupLog "Disk status written $diskStatusPath"
    } catch {
        Write-BackupLog "WARN: disk status failed $_"
    }
}

function Remove-OldBackupFolders {
    param([int]$KeepDays)
    if (-not (Test-Path $backupRoot)) {
        return
    }
    $today = (Get-Date).Date
    Get-ChildItem -Path $backupRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.Name -match '^backup_(\d{8})$') {
            $raw = $Matches[1]
        } else {
            return
        }
        $parsed = [datetime]::MinValue
        if (-not [datetime]::TryParseExact(
                $raw,
                "ddMMyyyy",
                [cultureinfo]::InvariantCulture,
                [System.Globalization.DateTimeStyles]::None,
                [ref]$parsed)) {
            return
        }
        $ageDays = ($today - $parsed.Date).Days
        if ($ageDays -ge $KeepDays) {
            Write-BackupLog "Removing expired folder $($_.FullName)"
            Remove-Item -LiteralPath $_.FullName -Recurse -Force
        }
    }
}

New-Item -ItemType Directory -Path $dayDir -Force | Out-Null

$cfg = @{}
Import-EnvFile -Path (Join-Path $deployDir ".env") -Target $cfg
Import-EnvFile -Path (Join-Path $scriptsDir "backup.env") -Target $cfg

$dbHost = if ($cfg.ContainsKey("DB_HOST")) { $cfg["DB_HOST"] } else { "127.0.0.1" }
if ($dbHost -eq "host.docker.internal") {
    $dbHost = "127.0.0.1"
}
$dbPort = if ($cfg.ContainsKey("DB_PORT")) { $cfg["DB_PORT"] } else { "3306" }
$dbName = if ($cfg.ContainsKey("DB_NAME")) { $cfg["DB_NAME"] } else { "diemdanhngay_bv87_db" }
$dbUser = if ($cfg.ContainsKey("DB_USER")) { $cfg["DB_USER"] } else { "diemdanh_user" }
$dbPass = if ($cfg.ContainsKey("DB_PASS")) { $cfg["DB_PASS"] } else { "" }
$retentionDays = 7
if ($cfg.ContainsKey("RETENTION_DAYS")) {
    $parsedRetention = 0
    if ([int]::TryParse($cfg["RETENTION_DAYS"], [ref]$parsedRetention) -and $parsedRetention -ge 1) {
        $retentionDays = $parsedRetention
    }
}
$mysqldumpConfigured = if ($cfg.ContainsKey("MYSQLDUMP")) { $cfg["MYSQLDUMP"] } else { "" }

Write-BackupLog "Backup start db=$dbName host=$dbHost port=$dbPort"

if ([string]::IsNullOrWhiteSpace($dbPass) -or $dbPass -eq "your-production-password") {
    Write-BackupLog "ERROR: Set DB_PASS in deploy\scripts\backup.env (copy from backup.env.example)."
    exit 1
}

$mysqldump = Resolve-MysqlDump -Configured $mysqldumpConfigured
if ([string]::IsNullOrWhiteSpace($mysqldump)) {
    Write-BackupLog "ERROR: mysqldump.exe not found. Install MySQL client or set MYSQLDUMP in backup.env."
    exit 1
}

$cnf = Join-Path $env:TEMP ("bv87-backup-" + [guid]::NewGuid().ToString("n") + ".cnf")
$sqlTmp = Join-Path $env:TEMP ("bv87-backup-" + [guid]::NewGuid().ToString("n") + ".sql")
$exitCode = 1
try {
    $passEscaped = $dbPass.Replace("\", "\\").Replace('"', '\"')
    @(
        "[client]"
        "user=$dbUser"
        "password=$passEscaped"
        "host=$dbHost"
        "port=$dbPort"
        "default-character-set=utf8mb4"
    ) | Set-Content -Path $cnf -Encoding ASCII

    $dumpArgs = @(
        "--defaults-extra-file=$cnf",
        "--single-transaction",
        "--quick",
        "--routines",
        "--triggers",
        "--events",
        "--hex-blob",
        "--add-drop-table",
        "--default-character-set=utf8mb4",
        $dbName
    )

    $p = Start-Process -FilePath $mysqldump -ArgumentList $dumpArgs `
        -RedirectStandardOutput $sqlTmp -RedirectStandardError (Join-Path $dayDir "mysqldump.err") `
        -Wait -PassThru -NoNewWindow
    $exitCode = $p.ExitCode
    if ($exitCode -ne 0) {
        $err = ""
        $errFile = Join-Path $dayDir "mysqldump.err"
        if (Test-Path $errFile) {
            $err = (Get-Content -Path $errFile -Raw -ErrorAction SilentlyContinue)
        }
        Write-BackupLog "ERROR: mysqldump exit $exitCode $err"
        exit $exitCode
    }

    $sizeSql = (Get-Item $sqlTmp).Length
    if ($sizeSql -lt 100) {
        Write-BackupLog "ERROR: dump too small ($sizeSql bytes)"
        exit 1
    }

    Compress-GzipFile -Source $sqlTmp -Destination $gzPath
    $sizeGz = (Get-Item $gzPath).Length
    Write-BackupLog "OK dump $sizeSql bytes -> $gzPath ($sizeGz bytes gzip)"
    if (Test-Path (Join-Path $dayDir "mysqldump.err")) {
        Remove-Item -LiteralPath (Join-Path $dayDir "mysqldump.err") -Force -ErrorAction SilentlyContinue
    }

    Remove-OldBackupFolders -KeepDays $retentionDays
    Invoke-WriteDiskStatus
    Write-BackupLog "Backup finished OK (retention $retentionDays days)"
    exit 0
} catch {
    Write-BackupLog "ERROR: $_"
    exit 1
} finally {
    if (Test-Path $cnf) { Remove-Item -LiteralPath $cnf -Force -ErrorAction SilentlyContinue }
    if (Test-Path $sqlTmp) { Remove-Item -LiteralPath $sqlTmp -Force -ErrorAction SilentlyContinue }
}
