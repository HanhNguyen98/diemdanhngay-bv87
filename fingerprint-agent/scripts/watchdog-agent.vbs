' P4 section 9.5.3 - run watchdog with no console flash (Task Scheduler)
' Window style 0 = hidden. //B on wscript suppresses script UI.
Option Explicit
Dim fso, sh, scriptsDir, ps1, cmd, rc
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
scriptsDir = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = scriptsDir & "\watchdog-agent.ps1"
cmd = "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File """ & ps1 & """"
rc = sh.Run(cmd, 0, True)
WScript.Quit rc
