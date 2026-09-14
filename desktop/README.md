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

### Build sạch (tránh code/DLL cũ)

Khi sửa enroll vân tay hoặc app vẫn crash như bản cũ:

```powershell
cd desktop
powershell -ExecutionPolicy Bypass -File .\rebuild-clean.ps1
```

Hoặc từng bước:

```powershell
Get-Process -Name "BV87" -ErrorAction SilentlyContinue | Stop-Process -Force
dotnet clean desktop/BV87.sln
Remove-Item -Recurse -Force desktop/src/BV87.App/bin, desktop/src/BV87.App/obj -ErrorAction SilentlyContinue
dotnet build desktop/BV87.sln -c Debug
```

**Luôn chạy đúng exe vừa build:**

- Debug: `desktop\src\BV87.App\bin\Debug\net8.0-windows\BV87.exe`
- Release: `desktop\src\BV87.App\bin\Release\net8.0-windows\BV87.exe`

Không dùng shortcut/desktop trỏ tới thư mục cũ. `run.ps1` luôn build Debug rồi `dotnet run` — khuyến nghị sau khi pull code mới.

## Chạy (khuyến nghị)

**PowerShell** (trong thư mục `desktop` — **bắt buộc** có `.\`):

```powershell
cd desktop
.\run.cmd
```

Agent quét chấm công (không login):

```powershell
.\run.cmd --agent
```

Token kiosk ghi vào `src\BV87.App\bin\Debug\net8.0-windows\agent.config.json` (không sửa file `.example` — build sẽ ghi đè).

**CMD** hoặc double-click `run.cmd`:

```cmd
cd desktop
run.cmd
```

Nếu `run.ps1` bị chặn Execution Policy:

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

Script tự tắt `BV87.exe` cũ, build, rồi mở app.

Hoặc thủ công:

```powershell
Get-Process -Name "BV87" -ErrorAction SilentlyContinue | Stop-Process -Force
dotnet run --project src/BV87.App/BV87.App.csproj
```

### Không thấy cửa sổ / build báo file bị khóa

1. **Tắt app cũ** — lỗi `MSB3027` / `BV87.Core.dll` bị khóa do `BV87.exe` còn chạy ngầm (Task Manager).
2. **Alt+Tab** — cửa sổ có thể nằm sau IDE.
3. **Xóa session** nếu treo lúc khởi động: `Remove-Item "$env:APPDATA\BV87\session.json"`
4. **Backend** phải chạy trước: `backend\start.ps1` (port 8082).

Hoặc chọn mode qua CLI:

```powershell
BV87.exe --mode=admin
BV87.exe --mode=head
BV87.exe --agent
```

`--mode=kiosk` **không** mở màn quét — kiosk chấm công chỉ `BV87.exe --agent`.

## Phân phối LAN bệnh viện (IT)

Một exe gồm **Admin + Head + Agent** (`--agent`). Client gọi **API server** — không nối MySQL trực tiếp.

```powershell
cd desktop\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\pack-release.ps1
```

Tạo `desktop\dist\BV87-Desktop-YYYYMMDD.zip` với:

- `BV87.exe` + runtime
- `appsettings.json` trỏ `http://192.170.182.14:8081` (sửa `deploy.defaults.json` nếu IP khác)
- `LanOnlyEnabled: true` — cấm trỏ API Internet
- `scripts\` (autostart, watchdog, init agent config)
- `HUONG-DAN-CAI-DAT.txt`

User tải ZIP, giải nén, chạy — **không** cần .NET SDK nhưng **cần .NET 8 Desktop Runtime x64** · **cấm** truy cập qua Internet/Cloudflare.

**Một gói ZIP** dùng cho Admin, Trưởng đơn vị (HEAD) và Kiosk (`BV87.exe --agent`). **Cấm** gửi thư mục `src/` cho user.

Hướng dẫn role + checklist Git/deploy: [`docs/HUONG_DAN_SU_DUNG.md`](../docs/HUONG_DAN_SU_DUNG.md). Chi tiết kiosk: `desktop/scripts/README.md` · SPEC §1.1.

## Cấu hình

| File | Ai dùng | Ghi chú |
|------|---------|---------|
| `appsettings.json` | Admin / Head | `ApiBaseUrl`, `LanOnlyEnabled` |
| `agent.config.json` | Kiosk `--agent` | `apiBaseUrl`, `kioskToken` |

Dev local (repo):

```json
{
  "ApiBaseUrl": "http://localhost:8082",
  "LanOnlyEnabled": false
}
```

Prod LAN: xem `appsettings.lan.example.json` hoặc gói ZIP từ `pack-release.ps1`.

## Auth (D0)

- HEAD/ADMIN: `POST /api/auth/desktop/login` → JWT Bearer
- **Đăng ký vân tay:** JWT — `POST /api/admin/fingerprints/enroll` hoặc `/api/head/fingerprints/enroll` (D1.1)

## Phase hiện tại

**D2** — HEAD Chấm công: bảng NV, KPI, lọc, chấm nhanh, khóa sổ.

**Tiếp theo:** D1.2 Quét IN/OUT · D3 Admin dashboard · H-05 Thống kê.

**Đăng ký vân tay (D1.1):** Sau login ADMIN/HEAD → **Tiện ích → Đăng ký vân tay**. `libzkfp.dll` nằm trong `src/BV87.App/lib/` (copy build → `lib\` cạnh exe). Xem `src/BV87.App/lib/README.md` nếu thiếu DLL.
