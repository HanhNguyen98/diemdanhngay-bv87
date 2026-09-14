# D1.2 / SPEC_FINGERPRINT §9.5.3 — shared WPF Agent alive check (PID file + cmdline fallback)
# Dot-source from watchdog-agent.ps1 / start-agent-silent.ps1

$script:Bv87WpfAgentScriptsDir = $PSScriptRoot

function Get-WpfAgentRootFromScripts {
    return (Split-Path -Parent $script:Bv87WpfAgentScriptsDir)
}

function Get-WpfAgentExe {
    param([string]$AgentRoot = (Get-WpfAgentRootFromScripts))
    return (Join-Path $AgentRoot "BV87.exe")
}

function Get-WpfAgentPidFile {
    param([string]$AgentRoot = (Get-WpfAgentRootFromScripts))
    $logDir = Join-Path $AgentRoot "logs"
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir | Out-Null
    }
    return (Join-Path $logDir "agent.pid")
}

function Test-WpfAgentProcessId {
    param([int]$ProcessId)
    try {
        $p = Get-Process -Id $ProcessId -ErrorAction Stop
        if ($p.ProcessName -ne "BV87") {
            return $false
        }
        $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
        if ($null -eq $cim -or [string]::IsNullOrWhiteSpace($cim.CommandLine)) {
            return $false
        }
        return ($cim.CommandLine -like "*--agent*")
    } catch {
        return $false
    }
}

function Find-WpfAgentProcessIdByCommandLine {
    param([string]$AgentRoot = (Get-WpfAgentRootFromScripts))
    $exePath = Get-WpfAgentExe -AgentRoot $AgentRoot
    $exeName = [System.IO.Path]::GetFileName($exePath)
    $procs = Get-CimInstance Win32_Process -Filter "Name = '$exeName'" -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        $cmd = $p.CommandLine
        if ($null -eq $cmd) { continue }
        if ($cmd -like "*--agent*") {
            return [int]$p.ProcessId
        }
    }
    return 0
}

function Test-WpfAgentRunning {
    param([string]$AgentRoot = (Get-WpfAgentRootFromScripts))
    $pidFile = Get-WpfAgentPidFile -AgentRoot $AgentRoot
    if (Test-Path $pidFile) {
        $raw = (Get-Content -Path $pidFile -Raw -ErrorAction SilentlyContinue)
        if ($null -ne $raw) {
            $raw = $raw.Trim()
            $parsed = 0
            if ([int]::TryParse($raw, [ref]$parsed) -and $parsed -gt 0) {
                if (Test-WpfAgentProcessId -ProcessId $parsed) {
                    return $true
                }
            }
        }
        Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
    }
    $foundId = Find-WpfAgentProcessIdByCommandLine -AgentRoot $AgentRoot
    if ($foundId -gt 0) {
        Save-WpfAgentPid -ProcessId $foundId -AgentRoot $AgentRoot
        return $true
    }
    return $false
}

function Save-WpfAgentPid {
    param(
        [Parameter(Mandatory = $true)][int]$ProcessId,
        [string]$AgentRoot = (Get-WpfAgentRootFromScripts)
    )
    $pidFile = Get-WpfAgentPidFile -AgentRoot $AgentRoot
    Set-Content -Path $pidFile -Value "$ProcessId" -Encoding ASCII -NoNewline
}

function Clear-WpfAgentPid {
    param([string]$AgentRoot = (Get-WpfAgentRootFromScripts))
    $pidFile = Get-WpfAgentPidFile -AgentRoot $AgentRoot
    if (Test-Path $pidFile) {
        Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
    }
}
