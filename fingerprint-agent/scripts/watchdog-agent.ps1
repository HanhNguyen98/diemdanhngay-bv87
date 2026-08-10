# P4 section 9.5.3 - restart Agent if not running
# Invoked by Task Scheduler via watchdog-agent.vbs every 2 minutes.
# Starts via start-agent-silent.ps1 (javaw, no CMD). Debug: start-agent.bat

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
$silent = Join-Path $scriptsDir "start-agent-silent.ps1"
$agentRoot = Split-Path -Parent $scriptsDir

. (Join-Path $scriptsDir "agent-process.ps1")

if (Test-AgentRunning -AgentRoot $agentRoot) {
    exit 0
}

if (-not (Test-Path $silent)) {
    Write-Error "Missing start-agent-silent.ps1 at $silent"
    exit 1
}

& $silent
exit $LASTEXITCODE
