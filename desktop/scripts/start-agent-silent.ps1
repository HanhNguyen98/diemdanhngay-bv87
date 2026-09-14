# D1.2 — start WPF Agent (BV87.exe --agent) without console flash.
# Used by autostart + watchdog. IT debug: start-agent.bat
# Failures append to logs/silent-start.log

param(
    [string]$AgentRoot = ""
)

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($AgentRoot)) {
    $AgentRoot = Split-Path -Parent $scriptsDir
}
Set-Location $AgentRoot

. (Join-Path $scriptsDir "agent-process.ps1")

function Write-SilentLog {
    param([string]$Message)
    $logDir = Join-Path $AgentRoot "logs"
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir | Out-Null
    }
    $line = "{0} {1}" -f (Get-Date -Format "o"), $Message
    Add-Content -Path (Join-Path $logDir "silent-start.log") -Value $line -Encoding UTF8
}

$exe = Get-WpfAgentExe -AgentRoot $AgentRoot
if (-not (Test-Path $exe)) {
    Write-SilentLog "Missing BV87.exe at $exe"
    exit 1
}

$configJson = Join-Path $AgentRoot "agent.config.json"
$configProps = Join-Path $AgentRoot "agent.properties"
if (-not (Test-Path $configJson) -and -not (Test-Path $configProps)) {
    Write-SilentLog "Missing agent.config.json or agent.properties. Run init-agent-config.ps1 first."
    exit 1
}

if (Test-WpfAgentRunning -AgentRoot $AgentRoot) {
    Write-SilentLog "WPF Agent already running - skip start"
    exit 0
}

try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $exe
    $psi.Arguments = "--agent"
    $psi.WorkingDirectory = $AgentRoot
    $psi.UseShellExecute = $false
    $proc = [System.Diagnostics.Process]::Start($psi)
    if ($null -eq $proc) {
        Write-SilentLog "Process.Start returned null"
        exit 1
    }
    Start-Sleep -Seconds 2
    if (-not (Test-WpfAgentProcessId -ProcessId $proc.Id)) {
        Clear-WpfAgentPid -AgentRoot $AgentRoot
        Write-SilentLog "BV87.exe exited within 2s (pid was $($proc.Id)). Use start-agent.bat for console error."
        exit 1
    }
    Save-WpfAgentPid -ProcessId $proc.Id -AgentRoot $AgentRoot
    Write-SilentLog "Started BV87.exe --agent ok pid=$($proc.Id)"
    exit 0
} catch {
    Write-SilentLog "Process.Start BV87.exe failed: $_"
    exit 1
}
