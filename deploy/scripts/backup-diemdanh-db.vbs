' B-BACKUP — run MySQL dump with no console flash (Task Scheduler)
Option Explicit
Dim fso, sh, scriptsDir, ps1, cmd, rc
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
scriptsDir = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = scriptsDir & "\backup-diemdanh-db.ps1"
cmd = "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File """ & ps1 & """"
rc = sh.Run(cmd, 0, True)
WScript.Quit rc
