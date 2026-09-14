# BV87 WPF Agent — triển khai trên PC kiosk (D1.2)

Agent chấm công vân tay: `BV87.exe --agent` (không đăng nhập Admin/Head).

Tham chiếu: `docs/SPEC_DESKTOP.md` §2.22 · `docs/SPEC_FINGERPRINT.md` §9.5.3.

## Cấu trúc thư mục trên PC khoa (gợi ý)

```
C:\BV87Agent\
  BV87.exe
  agent.config.json          ← tạo bằng init-agent-config.ps1 (không commit token)
  lib\                       ← libzkfpcsharp + DLL ZK
  logs\                      ← silent-start.log, agent.pid
  scripts\                   ← copy từ desktop/scripts/
  agent.config.json.example  ← tùy chọn (mẫu)
```

Build Release: `desktop\src\BV87.App\bin\Release\net8.0-windows\`

## Bước 0 — IT đóng gói (một lần)

```powershell
cd desktop\scripts
.\pack-release.ps1
```

Gửi file `desktop\dist\BV87-Desktop-*.zip` cho user. Sửa IP server trong `desktop\deploy.defaults.json` trước khi pack nếu cần.

## Bước 1 — Cấu hình

```powershell
cd C:\BV87Agent\scripts
Set-ExecutionPolicy -Scope Process Bypass

# Tạo agent.config.json từ mẫu
.\init-agent-config.ps1 -ApiBaseUrl "http://192.170.182.14:8081" -KioskToken "<token-tu-admin>"

# Hoặc sửa tay file C:\BV87Agent\agent.config.json
```

**Bắt buộc:** `apiBaseUrl`, `kioskToken` (Admin → Cài đặt → Quản lý token vân tay).

**Cấm** dùng `https://…cloudflare…` cho kiosk LAN — dùng IP/LAN nội bộ.

## Bước 2 — Chạy thử (IT)

```powershell
cd C:\BV87Agent\scripts
.\start-agent.bat
```

Hoặc trực tiếp: `BV87.exe --agent` trong thư mục có `agent.config.json`.

## Bước 3 — Autostart + watchdog (một lần)

User Windows đăng nhập hàng ngày (Interactive — **không** Windows Service):

```powershell
cd C:\BV87Agent\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\install-agent-autostart.ps1
.\install-watchdog.ps1
```

| Thành phần | Hành vi |
|------------|---------|
| Autostart | Startup → `start-agent-silent.vbs` → `BV87.exe --agent` |
| Watchdog | Task `BV87-WPF-Agent-Watchdog` mỗi **2 phút** — tự mở lại nếu crash |
| Cấm | Task Action = `powershell.exe` trực tiếp (nhấp nháy màn hình) |

**Sau đổi thư mục cài Agent:** chạy lại cả hai script install.

Kiểm tra: tắt Agent tay → ≤2 phút tự mở lại.

## Smoke test

1. Admin: token khoa **Online** (heartbeat ~30–90s).
2. Cắm ZK9500 → banner «Đã kết nối» / «Chờ đặt ngón tay…».
3. Quét 1 NV → banner tiếng Việt (`VÀO CHIỀU THÀNH CÔNG` / …), có bíp.
4. ScanLog / audit có `clientHostname`, `clientIp`.

## Log

- `logs\silent-start.log` — lỗi khởi động ẩn (autostart/watchdog)
- `logs\agent.pid` — PID process đang chạy (watchdog dùng để tránh start trùng)

## So với Java Agent cũ

| | Java `fingerprint-agent` | WPF D1.2 |
|--|--------------------------|----------|
| Binary | `fingerprint-agent.jar` + javaw | `BV87.exe --agent` |
| Config | `agent.properties` | **`agent.config.json`** (`kioskToken`) |
| Watchdog task | `BV87-Fingerprint-Agent-Watchdog` | `BV87-WPF-Agent-Watchdog` |
| Enroll trên máy | Có (PIN) | **Không** — enroll qua Admin/HEAD Tiện ích (JWT) |

Có thể chạy trên các máy khác nhau. **Cấm** Java Agent trên cùng PC kiosk — repo D5 đã xóa `fingerprint-agent/`. WPF **một** process `--agent` / máy.
