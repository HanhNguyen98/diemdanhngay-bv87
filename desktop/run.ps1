# Run BV87 desktop app (kills stale instance, builds, launches)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Get-Process -Name "BV87" -ErrorAction SilentlyContinue | Stop-Process -Force
dotnet build src/BV87.App/BV87.App.csproj -c Debug
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

dotnet run --project src/BV87.App/BV87.App.csproj --no-build -- @args
