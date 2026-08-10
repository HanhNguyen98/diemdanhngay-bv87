# P4 §9.5.1 — build fingerprint-agent.jar (no IntelliJ required on kiosk PCs)
# Usage (from fingerprint-agent/scripts):
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\build-agent-jar.ps1

$ErrorActionPreference = "Stop"
$agentRoot = Split-Path -Parent $PSScriptRoot
Set-Location $agentRoot

$javaHomeHint = ""
$javac = Get-Command javac -ErrorAction SilentlyContinue
if (-not $javac) {
    throw "javac not found on PATH. Install JDK 17+ and retry."
}

$libJar = Join-Path $agentRoot "lib\ZKFingerReader.jar"
if (-not (Test-Path $libJar)) {
    throw "Missing $libJar"
}

$outClasses = Join-Path $agentRoot "dist\classes"
$distJar = Join-Path $agentRoot "dist\fingerprint-agent.jar"
if (Test-Path $outClasses) {
    Remove-Item -Recurse -Force $outClasses
}
New-Item -ItemType Directory -Path $outClasses | Out-Null
New-Item -ItemType Directory -Path (Join-Path $agentRoot "dist") -Force | Out-Null

$sources = Get-ChildItem -Path (Join-Path $agentRoot "src") -Recurse -Filter "*.java" |
    Where-Object { $_.FullName -notmatch '\\ZKFPDemo\.java$' } |
    ForEach-Object { $_.FullName }

if (-not $sources -or $sources.Count -eq 0) {
    throw "No Java sources found under src\"
}

Write-Host "Compiling $($sources.Count) sources..."
& javac -encoding UTF-8 -cp $libJar -d $outClasses @sources
if ($LASTEXITCODE -ne 0) {
    throw "javac failed with exit $LASTEXITCODE"
}

# Resources (branding + sounds) — same paths as IntelliJ output
$brandingSrc = Join-Path $agentRoot "src\branding"
$soundsSrc = Join-Path $agentRoot "src\sounds"
if (Test-Path $brandingSrc) {
    Copy-Item -Recurse -Force $brandingSrc (Join-Path $outClasses "branding")
}
if (Test-Path $soundsSrc) {
    Copy-Item -Recurse -Force $soundsSrc (Join-Path $outClasses "sounds")
}

$jarExe = Get-Command jar -ErrorAction SilentlyContinue
if (-not $jarExe) {
    throw "jar tool not found on PATH (JDK bin)."
}

if (Test-Path $distJar) {
    Remove-Item -Force $distJar
}

Push-Location $outClasses
try {
    & jar --create --file $distJar --main-class com.bv87.fingerprint.agent.FingerprintAgentApp -C . .
    if ($LASTEXITCODE -ne 0) {
        throw "jar failed with exit $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

Write-Host "Built: $distJar"
Write-Host "Run via scripts\start-agent.bat (prefers dist\fingerprint-agent.jar)."
