@echo off
REM P4 / §9.5.3 — DEBUG / IT only (visible CMD + pause on error).
REM Ops (autostart + watchdog): use start-agent-silent.ps1 (javaw, no CMD).
REM SPEC_FINGERPRINT §9.4 / §9.5 — prefer dist JAR, else IntelliJ classes
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0.."

where java >nul 2>&1
if errorlevel 1 (
  echo [FingerprintAgent] Khong tim thay Java tren PATH. Cai JDK 17+ hoac them vao PATH.
  pause
  exit /b 1
)

set "CP="
set "MAIN=com.bv87.fingerprint.agent.FingerprintAgentApp"

REM --- P4: prefer packaged jar ---
if exist "dist\fingerprint-agent.jar" (
  set "CP=dist\fingerprint-agent.jar;lib\*"
  echo [FingerprintAgent] Using dist\fingerprint-agent.jar
  goto :libpath
)

set "CLASSES="
set "MAIN_REL=com\bv87\fingerprint\agent\FingerprintAgentApp.class"

REM --- Fallback: IntelliJ compiler output ---
if exist "classes\production\ZKFinger Demo2\%MAIN_REL%" (
  set "CLASSES=classes\production\ZKFinger Demo2"
  goto :found
)
if exist "classes\production\fingerprint-agent\%MAIN_REL%" (
  set "CLASSES=classes\production\fingerprint-agent"
  goto :found
)
if exist "classes\production\" (
  for /f "delims=" %%D in ('dir /b /ad /o-d "classes\production" 2^>nul') do (
    if exist "classes\production\%%D\%MAIN_REL%" (
      set "CLASSES=classes\production\%%D"
      goto :found
    )
  )
)

if exist "out\production\fingerprint-agent\%MAIN_REL%" (
  set "CLASSES=out\production\fingerprint-agent"
  goto :found
)
if exist "out\production\ZKFinger Demo2\%MAIN_REL%" (
  set "CLASSES=out\production\ZKFinger Demo2"
  goto :found
)
if exist "out\production\" (
  for /f "delims=" %%D in ('dir /b /ad /o-d "out\production" 2^>nul') do (
    if exist "out\production\%%D\%MAIN_REL%" (
      set "CLASSES=out\production\%%D"
      goto :found
    )
  )
)

if exist "out\%MAIN_REL%" (
  set "CLASSES=out"
  goto :found
)

if exist "target\classes\%MAIN_REL%" (
  set "CLASSES=target\classes"
  goto :found
)

echo [FingerprintAgent] Khong tim thay JAR hoac class da build ^(FingerprintAgentApp^).
echo Hay chay: scripts\build-agent-jar.ps1
echo Hoac Run FingerprintAgentApp trong IntelliJ, roi chay lai bat.
echo Working dir: %CD%
pause
exit /b 1

:found
echo [FingerprintAgent] Classes: %CLASSES%
set "CP=%CLASSES%;lib\*"

:libpath
REM P4b — java.library.path must include System32 when lib\ has no libzkfp.dll
set "LIBPATH=%CD%\lib;%SystemRoot%\System32"
if defined PATH (
  set "LIBPATH=%LIBPATH%;%PATH%"
)

set "HAS_DLL=0"
if exist "lib\libzkfp.dll" set "HAS_DLL=1"
if exist "%SystemRoot%\System32\libzkfp.dll" set "HAS_DLL=1"
if "%HAS_DLL%"=="0" (
  echo [FingerprintAgent] Khong tim thay libzkfp.dll.
  echo Can: cai driver ZKFinger ^(thuong co o System32^) hoac copy DLL vao:
  echo   %CD%\lib\
  pause
  exit /b 1
)

echo [FingerprintAgent] java.library.path=%LIBPATH%
java -Dfile.encoding=UTF-8 -Djava.library.path="%LIBPATH%" -cp "%CP%" %MAIN%
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" (
  echo [FingerprintAgent] Java exit code %EC%
  pause
)
endlocal
exit /b %EC%
