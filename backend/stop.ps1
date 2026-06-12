# Stop backend — free port 8082
$PORT = 8082

$pids = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

if (-not $pids) {
    Write-Host "Port $PORT is free."
    exit 0
}

foreach ($processId in $pids) {
    try {
        $proc = Get-Process -Id $processId -ErrorAction Stop
        Write-Host "Stopping PID $processId ($($proc.ProcessName)) on port $PORT..."
        Stop-Process -Id $processId -Force
    } catch {
        Write-Host "Could not stop PID $processId"
    }
}

Start-Sleep -Milliseconds 500

$still = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue
if ($still) {
    Write-Host "Warning: port $PORT may still be in use."
} else {
    Write-Host "Port $PORT released."
}
