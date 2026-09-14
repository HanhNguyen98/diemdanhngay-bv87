# Clean rebuild — remove bin/obj so old DLL/EXE are not reused
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Stopping BV87.exe..."
Get-Process -Name "BV87" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 500

Write-Host "Cleaning solution..."
dotnet clean BV87.sln -c Debug --nologo -v q
dotnet clean BV87.sln -c Release --nologo -v q

Write-Host "Removing bin/obj..."
$dirs = @(
    "src\BV87.App\bin",
    "src\BV87.App\obj",
    "src\BV87.Core\bin",
    "src\BV87.Core\obj"
)
foreach ($d in $dirs) {
    if (Test-Path $d) {
        Remove-Item -Recurse -Force $d
    }
}

Write-Host "Building Debug..."
dotnet build BV87.sln -c Debug --no-incremental
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$exe = Join-Path $PSScriptRoot "src\BV87.App\bin\Debug\net8.0-windows\BV87.exe"
Write-Host ""
Write-Host "Built OK. Run this exe:" -ForegroundColor Green
Write-Host "  $exe"
Write-Host ""
Write-Host "Or: .\run.ps1"
