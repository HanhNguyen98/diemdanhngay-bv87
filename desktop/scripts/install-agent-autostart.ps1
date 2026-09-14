# D1.2 — Startup shortcut -> silent VBS -> BV87.exe --agent (no CMD/PowerShell flash)
# Also run install-watchdog.ps1 for crash recovery.
# Debug with console: scripts\start-agent.bat
param(
    [string]$AgentRoot = "",
    [string]$ShortcutName = "BV87 Agent Chấm công"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($AgentRoot)) {
    $AgentRoot = Split-Path -Parent $PSScriptRoot
}

$exe = Join-Path $AgentRoot "BV87.exe"
if (-not (Test-Path $exe)) {
    Write-Error "BV87.exe not found at: $exe"
}

$vbs = Join-Path $PSScriptRoot "start-agent-silent.vbs"
if (-not (Test-Path $vbs)) {
    throw "Missing start-agent-silent.vbs at $vbs"
}

$startup = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startup "$ShortcutName.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "$env:SystemRoot\System32\wscript.exe"
$shortcut.Arguments = "//B `"$vbs`""
$shortcut.WorkingDirectory = $AgentRoot
$shortcut.WindowStyle = 7
$shortcut.Description = "BV87 WPF kiosk fingerprint agent (D1.2 silent autostart)"
$shortcut.Save()

Write-Host "Created Startup shortcut:"
Write-Host "  $shortcutPath"
Write-Host "Target: wscript //B start-agent-silent.vbs (BV87.exe --agent, no flash)."
Write-Host "Agent root: $AgentRoot"
Write-Host "Also run install-watchdog.ps1 for crash recovery."
Write-Host "Debug: run scripts\start-agent.bat"
