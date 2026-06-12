# Start backend — kill port 8082 first, then run Spring Boot
$ErrorActionPreference = "Stop"

& "$PSScriptRoot\stop.ps1"

if (-not (Test-Path "$PSScriptRoot\local-secrets.yml")) {
    Write-Host ""
    Write-Host "Missing local-secrets.yml — run:"
    Write-Host "  copy local-secrets.example.yml local-secrets.yml"
    Write-Host "  then set spring.datasource.password"
    exit 1
}

$env:DB_NAME = "diemdanhngay_bv87_db"
$env:DB_USER = "root"

Write-Host ""
Write-Host "Starting API on http://localhost:8082"
Write-Host 'Press Ctrl+C to stop, then run: .\stop.ps1'
Write-Host ""

Set-Location $PSScriptRoot
mvn spring-boot:run
