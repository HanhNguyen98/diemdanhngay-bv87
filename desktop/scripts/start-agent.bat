@echo off
REM D1.2 — DEBUG / IT only (visible CMD). Ops: start-agent-silent.ps1 / .vbs
setlocal EnableExtensions
cd /d "%~dp0.."

if not exist "BV87.exe" (
  echo [BV87 Agent] Khong tim thay BV87.exe trong:
  echo   %CD%
  echo Copy build Release net8.0-windows len thu muc nay.
  pause
  exit /b 1
)

if not exist "agent.config.json" if not exist "agent.properties" (
  echo [BV87 Agent] Thieu agent.config.json hoac agent.properties.
  echo Chay: scripts\init-agent-config.ps1
  pause
  exit /b 1
)

echo [BV87 Agent] Starting BV87.exe --agent ...
BV87.exe --agent
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" (
  echo [BV87 Agent] Exit code %EC%
  pause
)
endlocal
exit /b %EC%
