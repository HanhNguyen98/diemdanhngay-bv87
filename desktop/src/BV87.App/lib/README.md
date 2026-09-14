# ZKFinger native libraries (BV87 desktop)

`libzkfp.dll` and any sibling DLLs from the ZKFinger driver/SDK must live in this folder.
MSBuild copies `lib\**` next to `BV87.exe` on build.

## Setup (new machine)

1. Install the ZKFinger driver for ZK9500 (same as Fingerprint Agent Java).
2. Copy from System32 if this folder is empty:

```powershell
Copy-Item "$env:SystemRoot\System32\libzkfp.dll" `
  -Destination "$PSScriptRoot\libzkfp.dll"
```

3. Rebuild: `desktop\rebuild-clean.ps1`

The app calls `SetDllDirectory` on this folder before loading the SDK (SPEC D1.1l).
