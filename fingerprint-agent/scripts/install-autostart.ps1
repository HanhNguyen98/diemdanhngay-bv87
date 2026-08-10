# P4a / section 9.5.3 - Startup shortcut -> silent VBS -> javaw (no CMD/PowerShell flash)
# Also run install-watchdog.ps1 for crash recovery (not a Windows Service).
# Debug with console: scripts\start-agent.bat
# Run once:
#   Set-ExecutionPolicy -Scope Process Bypass; .\install-autostart.ps1

$ErrorActionPreference = "Stop"
$agentRoot = Split-Path -Parent $PSScriptRoot
$vbs = Join-Path $PSScriptRoot "start-agent-silent.vbs"
if (-not (Test-Path $vbs)) {
    throw "Missing start-agent-silent.vbs at $vbs"
}

$startup = [Environment]::GetFolderPath("Startup")
$lnkPath = Join-Path $startup "BV87-Fingerprint-Agent.lnk"

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($lnkPath)
$shortcut.TargetPath = "$env:SystemRoot\System32\wscript.exe"
$shortcut.Arguments = "//B `"$vbs`""
$shortcut.WorkingDirectory = $agentRoot
$shortcut.WindowStyle = 7
$shortcut.Description = "BV87 Fingerprint Agent (P4a silent autostart via VBS)"
$shortcut.Save()

Write-Host "Created Startup shortcut:"
Write-Host "  $lnkPath"
Write-Host "Target: wscript //B start-agent-silent.vbs (javaw, no flash)."
Write-Host "Debug: run scripts\start-agent.bat"
Write-Host "Also run install-watchdog.ps1 for crash recovery."
