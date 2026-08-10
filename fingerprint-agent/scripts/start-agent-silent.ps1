# P4 section 9.5.3 - start Agent with javaw (no CMD window). Used by autostart + watchdog.
# IT debug with console: start-agent.bat
# Prefer start-agent-silent.vbs from Task Scheduler / Startup (no PowerShell flash).
# Failures append to fingerprint-agent/logs/silent-start.log

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
$agentRoot = Split-Path -Parent $scriptsDir
Set-Location $agentRoot

. (Join-Path $scriptsDir "agent-process.ps1")

function Write-SilentLog {
    param([string]$Message)
    $logDir = Join-Path $agentRoot "logs"
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir | Out-Null
    }
    $line = "{0} {1}" -f (Get-Date -Format "o"), $Message
    Add-Content -Path (Join-Path $logDir "silent-start.log") -Value $line -Encoding UTF8
}

$javawCmd = Get-Command javaw -ErrorAction SilentlyContinue
if ($null -eq $javawCmd) {
    Write-SilentLog "javaw not found on PATH. Install JDK 17+ or use start-agent.bat for diagnostics."
    exit 1
}

$main = "com.bv87.fingerprint.agent.FingerprintAgentApp"
$mainRel = "com\bv87\fingerprint\agent\FingerprintAgentApp.class"
$cp = $null

$jar = Join-Path $agentRoot "dist\fingerprint-agent.jar"
if (Test-Path $jar) {
    $cp = "dist\fingerprint-agent.jar;lib\*"
} else {
    $candidates = @(
        "classes\production\ZKFinger Demo2",
        "classes\production\fingerprint-agent",
        "out\production\fingerprint-agent",
        "out\production\ZKFinger Demo2",
        "out",
        "target\classes"
    )
    foreach ($rel in $candidates) {
        $full = Join-Path $agentRoot $rel
        if (Test-Path (Join-Path $full $mainRel)) {
            $cp = "$rel;lib\*"
            break
        }
    }
    if ($null -eq $cp) {
        foreach ($prodRootName in @("classes\production", "out\production")) {
            $prodRoot = Join-Path $agentRoot $prodRootName
            if (-not (Test-Path $prodRoot)) { continue }
            $dirs = Get-ChildItem -Path $prodRoot -Directory -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending
            foreach ($d in $dirs) {
                if (Test-Path (Join-Path $d.FullName $mainRel)) {
                    $rel = Join-Path $prodRootName $d.Name
                    $cp = "$rel;lib\*"
                    break
                }
            }
            if ($null -ne $cp) { break }
        }
    }
}

if ($null -eq $cp) {
    Write-SilentLog "Missing JAR or FingerprintAgentApp classes under $agentRoot. Run build-agent-jar.ps1 or start-agent.bat."
    exit 1
}

# SPEC 9.5.3 - only lib + System32 (never full PATH)
$libPath = "{0}\lib;{1}\System32" -f $agentRoot, $env:SystemRoot

$hasDll = (Test-Path (Join-Path $agentRoot "lib\libzkfp.dll")) -or
    (Test-Path (Join-Path $env:SystemRoot "System32\libzkfp.dll"))
if (-not $hasDll) {
    Write-SilentLog "libzkfp.dll not found in lib\ or System32. Install ZKFinger driver or copy DLL."
    exit 1
}

if (Test-AgentRunning -AgentRoot $agentRoot) {
    Write-SilentLog "Agent already running - skip start"
    exit 0
}

$argLine = '-Dfile.encoding=UTF-8 "-Djava.library.path={0}" -cp "{1}" {2}' -f $libPath, $cp, $main

try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $javawCmd.Source
    $psi.Arguments = $argLine
    $psi.WorkingDirectory = $agentRoot
    $psi.UseShellExecute = $false
    $proc = [System.Diagnostics.Process]::Start($psi)
    if ($null -eq $proc) {
        Write-SilentLog "Process.Start returned null"
        exit 1
    }
    Start-Sleep -Seconds 2
    if (-not (Test-JavaAgentProcessId -ProcessId $proc.Id)) {
        Clear-AgentPid -AgentRoot $agentRoot
        Write-SilentLog "javaw exited within 2s (pid was $($proc.Id)). cp=$cp libPath=$libPath. Use start-agent.bat to see console error."
        exit 1
    }
    Save-AgentPid -ProcessId $proc.Id -AgentRoot $agentRoot
    Write-SilentLog "Started javaw ok pid=$($proc.Id) cp=$cp"
    exit 0
} catch {
    Write-SilentLog "Process.Start javaw failed: $_"
    exit 1
}
