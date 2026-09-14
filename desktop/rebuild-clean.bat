@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0rebuild-clean.ps1"
exit /b %ERRORLEVEL%
