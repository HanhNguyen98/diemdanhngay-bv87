# D1 packaging — build Release ZIP for hospital LAN deployment (SPEC §1.1)
param(
    [string]$Configuration = "Release",
    [string]$OutputRoot = "",
    [string]$VersionLabel = ""
)

$ErrorActionPreference = "Stop"
$desktopRoot = Split-Path -Parent $PSScriptRoot
$sln = Join-Path $desktopRoot "BV87.sln"
$buildOut = Join-Path $desktopRoot "src\BV87.App\bin\$Configuration\net8.0-windows"
$defaultsPath = Join-Path $desktopRoot "deploy.defaults.json"

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $desktopRoot "dist"
}

if ([string]::IsNullOrWhiteSpace($VersionLabel)) {
    $VersionLabel = Get-Date -Format "yyyyMMdd"
}

$defaults = @{
    hospitalApiBaseUrl = "http://192.170.182.14:8081"
    lanOnlyEnabled     = $true
}
if (Test-Path $defaultsPath) {
    $defaults = Get-Content $defaultsPath -Raw -Encoding UTF8 | ConvertFrom-Json
}

Write-Host "Building $Configuration ..."
Push-Location $desktopRoot
try {
    dotnet build $sln -c $Configuration --no-incremental
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

if (-not (Test-Path (Join-Path $buildOut "BV87.exe"))) {
    throw "Build output missing: $buildOut\BV87.exe"
}

$stageName = "BV87-Desktop-$VersionLabel"
$stageDir = Join-Path $OutputRoot $stageName
if (Test-Path $stageDir) {
    Remove-Item -Recurse -Force $stageDir
}
New-Item -ItemType Directory -Path $stageDir | Out-Null

Write-Host "Staging to $stageDir ..."
Copy-Item -Path (Join-Path $buildOut "*") -Destination $stageDir -Recurse -Force

# Never ship dev secrets or local agent config from build machine
foreach ($remove in @("agent.config.json", "appsettings.Development.json")) {
    $p = Join-Path $stageDir $remove
    if (Test-Path $p) {
        Remove-Item -Force $p
    }
}

$scriptsDest = Join-Path $stageDir "scripts"
New-Item -ItemType Directory -Path $scriptsDest | Out-Null
Copy-Item -Path (Join-Path $PSScriptRoot "*.ps1") -Destination $scriptsDest -Force
Copy-Item -Path (Join-Path $PSScriptRoot "*.vbs") -Destination $scriptsDest -Force
Copy-Item -Path (Join-Path $PSScriptRoot "*.bat") -Destination $scriptsDest -Force
Copy-Item -Path (Join-Path $PSScriptRoot "agent.config.lan.example.json") -Destination $scriptsDest -Force
Copy-Item -Path (Join-Path $PSScriptRoot "agent.config.json.example") -Destination $scriptsDest -Force
Copy-Item -Path (Join-Path $PSScriptRoot "README.md") -Destination $scriptsDest -Force

$appSettings = @{
    ApiBaseUrl      = $defaults.hospitalApiBaseUrl
    LanOnlyEnabled  = [bool]$defaults.lanOnlyEnabled
    SavedMode       = $null
    KioskToken      = $null
}
$appSettings | ConvertTo-Json -Depth 3 | Set-Content -Path (Join-Path $stageDir "appsettings.json") -Encoding UTF8

$agentExample = Join-Path $PSScriptRoot "agent.config.lan.example.json"
if (Test-Path $agentExample) {
    Copy-Item $agentExample (Join-Path $stageDir "agent.config.json.example") -Force
}

$guide = @"
BV87 Desktop — Hướng dẫn cài đặt (LAN bệnh viện)
==============================================

1) Giải nén toàn bộ thư mục này vào PC (ví dụ C:\BV87).

2) Admin / Trưởng đơn vị:
   - Chạy BV87.exe
   - appsettings.json đã trỏ máy chủ: $($defaults.hospitalApiBaseUrl)
   - Đăng nhập tài khoản HEAD hoặc ADMIN

3) Máy kiosk chấm công:
   - scripts\init-agent-config.ps1 -KioskToken "<token-tu-admin>"
   - Chạy BV87.exe --agent
   - Cài autostart: scripts\install-agent-autostart.ps1
   - Cài watchdog: scripts\install-watchdog.ps1

4) Yêu cầu:
   - PC phải trong mạng LAN bệnh viện (cấm truy cập qua Internet / Cloudflare)
   - Máy chủ Spring Boot + MySQL chạy trên server LAN (client không nối DB trực tiếp)
   - Một gói ZIP dùng cho Admin, Trưởng đơn vị (HEAD) và Kiosk Agent (--agent)
   - Cài .NET 8 Desktop Runtime x64 trên mỗi PC (ZIP không kèm runtime)
   - Gỡ Agent Java (fingerprint-agent.jar) trên cùng máy kiosk
   - Chỉ một cửa sổ BV87.exe --agent trên mỗi máy

5) IT:
   - Build gói: desktop\scripts\pack-release.ps1 (Release — LanOnlyEnabled bắt buộc trong exe)
   - Server: docker compose KHÔNG bật profile tunnel / Cloudflare
   - Token: dán vào agent.config.json (kioskToken), KHÔNG dùng agent.properties cho WPF
   - scripts\start-agent.bat (kiosk)

"@
Set-Content -Path (Join-Path $stageDir "HUONG-DAN-CAI-DAT.txt") -Value $guide -Encoding UTF8

if (-not (Test-Path $OutputRoot)) {
    New-Item -ItemType Directory -Path $OutputRoot | Out-Null
}
$zipPath = Join-Path $OutputRoot "$stageName.zip"
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}
Compress-Archive -Path $stageDir -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "Done."
Write-Host "  Folder: $stageDir"
Write-Host "  ZIP:    $zipPath"
Write-Host "  ApiBaseUrl in package: $($defaults.hospitalApiBaseUrl)"
