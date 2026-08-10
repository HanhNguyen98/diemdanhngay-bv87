# P4 section 9.5.3 - shared Agent alive check (PID file + cmdline fallback)
# Dot-source from watchdog-agent.ps1 / start-agent-silent.ps1

$script:Bv87AgentScriptsDir = $PSScriptRoot

function Get-AgentRootFromScripts {
    return (Split-Path -Parent $script:Bv87AgentScriptsDir)
}

function Get-AgentPidFile {
    param([string]$AgentRoot = (Get-AgentRootFromScripts))
    $logDir = Join-Path $AgentRoot "logs"
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir | Out-Null
    }
    return (Join-Path $logDir "agent.pid")
}

function Test-JavaAgentProcessId {
    param([int]$ProcessId)
    try {
        $p = Get-Process -Id $ProcessId -ErrorAction Stop
        $n = $p.ProcessName.ToLowerInvariant()
        return ($n -eq "java" -or $n -eq "javaw")
    } catch {
        return $false
    }
}

function Find-AgentProcessIdByCommandLine {
    foreach ($procName in @("java.exe", "javaw.exe")) {
        $procs = Get-CimInstance Win32_Process -Filter "Name = '$procName'" -ErrorAction SilentlyContinue
        foreach ($p in $procs) {
            $cmd = $p.CommandLine
            if ($null -eq $cmd) { continue }
            if ($cmd -like "*FingerprintAgentApp*" -or $cmd -like "*fingerprint-agent.jar*") {
                return [int]$p.ProcessId
            }
        }
    }
    return 0
}

function Test-AgentByCommandLine {
    return ((Find-AgentProcessIdByCommandLine) -gt 0)
}

function Test-AgentRunning {
    param([string]$AgentRoot = (Get-AgentRootFromScripts))
    $pidFile = Get-AgentPidFile -AgentRoot $AgentRoot
    if (Test-Path $pidFile) {
        $raw = (Get-Content -Path $pidFile -Raw -ErrorAction SilentlyContinue)
        if ($null -ne $raw) {
            $raw = $raw.Trim()
            $parsed = 0
            if ([int]::TryParse($raw, [ref]$parsed) -and $parsed -gt 0) {
                if (Test-JavaAgentProcessId -ProcessId $parsed) {
                    return $true
                }
            }
        }
        Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
    }
    $foundId = Find-AgentProcessIdByCommandLine
    if ($foundId -gt 0) {
        # Persist for next watchdog tick (cmdline often null under Task Scheduler)
        Save-AgentPid -ProcessId $foundId -AgentRoot $AgentRoot
        return $true
    }
    return $false
}

function Save-AgentPid {
    param(
        [Parameter(Mandatory = $true)][int]$ProcessId,
        [string]$AgentRoot = (Get-AgentRootFromScripts)
    )
    $pidFile = Get-AgentPidFile -AgentRoot $AgentRoot
    Set-Content -Path $pidFile -Value "$ProcessId" -Encoding ASCII -NoNewline
}

function Clear-AgentPid {
    param([string]$AgentRoot = (Get-AgentRootFromScripts))
    $pidFile = Get-AgentPidFile -AgentRoot $AgentRoot
    if (Test-Path $pidFile) {
        Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
    }
}
