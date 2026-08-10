' P4 section 9.5.3 - silent Agent start with no PowerShell flash (Startup shortcut)
Option Explicit
Dim fso, sh, scriptsDir, ps1, cmd, rc
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
scriptsDir = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = scriptsDir & "\start-agent-silent.ps1"
cmd = "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File """ & ps1 & """"
rc = sh.Run(cmd, 0, True)
WScript.Quit rc
