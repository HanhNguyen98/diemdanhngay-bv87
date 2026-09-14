@echo off
setlocal
cd /d "%~dp0"

taskkill /IM BV87.exe /F >nul 2>&1
dotnet build src\BV87.App\BV87.App.csproj -c Debug
if errorlevel 1 exit /b 1

dotnet run --project src\BV87.App\BV87.App.csproj --no-build -- %*
