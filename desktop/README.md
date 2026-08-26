# BV87 Desktop (WPF)

Client desktop thay thế Web/Mobile — binding: `docs/SPEC_DESKTOP.md`.

## Yêu cầu

- .NET 8 SDK (hoặc mới hơn, build target `net8.0-windows`)
- Windows 10/11
- Backend Spring Boot chạy tại `ApiBaseUrl` (mặc định `http://localhost:8082`)

## Build

```powershell
cd desktop
dotnet build BV87.sln -c Release
```

Output: `desktop/src/BV87.App/bin/Release/net8.0-windows/BV87.exe`

## Chạy

```powershell
dotnet run --project src/BV87.App/BV87.App.csproj
```

Hoặc chọn mode qua CLI:

```powershell
BV87.exe --mode=admin
BV87.exe --mode=head
BV87.exe --mode=kiosk
```

## Cấu hình

Chỉnh `src/BV87.App/appsettings.json` (copy cùng thư mục exe sau build):

```json
{
  "ApiBaseUrl": "http://localhost:8082",
  "KioskToken": null
}
```

## Auth (D0)

- HEAD/ADMIN: `POST /api/auth/desktop/login` → JWT Bearer
- Kiosk: `X-Kiosk-Token` (phase D1)

## Phase hiện tại

**D0** — Login JWT, chọn mode, shell placeholder. Nghiệp vụ đầy đủ theo phases D1–D5 trong SPEC.
