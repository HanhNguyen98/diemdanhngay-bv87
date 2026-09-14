# D1.2 / SPEC_FINGERPRINT §9.5.3 — restart WPF Agent if not running
# Invoked by Task Scheduler via watchdog-agent.vbs every 2 minutes.

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
$silent = Join-Path $scriptsDir "start-agent-silent.ps1"
$agentRoot = Split-Path -Parent $scriptsDir

. (Join-Path $scriptsDir "agent-process.ps1")

if (Test-WpfAgentRunning -AgentRoot $agentRoot) {
    exit 0
}

if (-not (Test-Path $silent)) {
    Write-Error "Missing start-agent-silent.ps1 at $silent"
    exit 1
}

& $silent -AgentRoot $agentRoot
exit $LASTEXITCODE
