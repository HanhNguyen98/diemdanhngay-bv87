# D1.2 — create agent.config.json on kiosk PC (never commit real tokens to git)
param(
    [string]$AgentRoot = "",
    [string]$ApiBaseUrl = "",
    [string]$KioskToken = "",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($AgentRoot)) {
    $AgentRoot = Split-Path -Parent $PSScriptRoot
}

$configPath = Join-Path $AgentRoot "agent.config.json"
$exampleInRoot = Join-Path $AgentRoot "agent.config.json.example"
$exampleInScripts = Join-Path $PSScriptRoot "agent.config.json.example"
$exampleInRepo = Join-Path (Split-Path -Parent $PSScriptRoot) "src\BV87.App\agent.config.json.example"

if ((Test-Path $configPath) -and -not $Force) {
    Write-Host "agent.config.json already exists at:"
    Write-Host "  $configPath"
    Write-Host "Use -Force to overwrite, or edit the file manually."
    exit 0
}

$templatePath = $null
if (Test-Path $exampleInRoot) {
    $templatePath = $exampleInRoot
} elseif (Test-Path $exampleInScripts) {
    $templatePath = $exampleInScripts
} elseif (Test-Path $exampleInRepo) {
    $templatePath = $exampleInRepo
} else {
    throw "Missing agent.config.json.example (copy from repo desktop/src/BV87.App/)"
}

$config = Get-Content -Path $templatePath -Raw -Encoding UTF8 | ConvertFrom-Json

$defaultsPath = Join-Path (Split-Path -Parent $PSScriptRoot) "deploy.defaults.json"
if (Test-Path $defaultsPath) {
    $deployDefaults = Get-Content $defaultsPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ([string]::IsNullOrWhiteSpace($ApiBaseUrl) -and $deployDefaults.hospitalApiBaseUrl) {
        $config.apiBaseUrl = $deployDefaults.hospitalApiBaseUrl
    }
    if ($null -ne $deployDefaults.lanOnlyEnabled) {
        $config.lanOnlyEnabled = [bool]$deployDefaults.lanOnlyEnabled
    } else {
        $config.lanOnlyEnabled = $true
    }
}
else {
    $config.lanOnlyEnabled = $true
}

if (-not [string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
    $config.apiBaseUrl = $ApiBaseUrl.Trim()
} elseif ([string]::IsNullOrWhiteSpace($config.apiBaseUrl)) {
    $config.apiBaseUrl = "http://localhost:8082"
}

if (-not [string]::IsNullOrWhiteSpace($KioskToken)) {
    $config.kioskToken = $KioskToken.Trim()
}

if ([string]::IsNullOrWhiteSpace($config.kioskToken) -or $config.kioskToken -eq "local-kiosk-dept-02") {
    Write-Host ""
    Write-Host "IMPORTANT: Set kioskToken from Admin -> Cai dat -> Quan ly token van tay."
    Write-Host "Edit after create:"
    Write-Host "  $configPath"
    Write-Host ""
}

$config | ConvertTo-Json -Depth 5 | Set-Content -Path $configPath -Encoding UTF8
Write-Host "Created: $configPath"
Write-Host "apiBaseUrl = $($config.apiBaseUrl)"
