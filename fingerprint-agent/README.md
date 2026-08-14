# Fingerprint Agent (ZK9500) — BV87

Fork từ ZKFinger Demo2 (JDK 17 + `ZKFingerReader.jar`).

Binding: `docs/SPEC_FINGERPRINT.md` (§9, **P4a–P4** §9.4–§9.5).

## Chạy local

1. Copy `agent.properties.example` → `agent.properties`, sửa `kiosk.token` / `api.baseUrl` / `enroll.pin` (+ P4a `device.autoOpen*` / P4 `heartbeat.*` nếu cần).
2. Logo Agent: `src/branding/biometrics.png`, `src/branding/hospital-logo.png` — **không** lấy từ Web.
3. Native ZKFinger: `lib\` (`ZKFingerReader.jar` + DLL nếu có) — bat/IntelliJ: `-Djava.library.path` gồm **`lib` + `%SystemRoot%\System32`** (P4b). Preflight `libzkfp.dll`.
4. Âm (P2.1c): `src/sounds/…`; tắt `sound.enabled=false`.
5. PIN Đăng ký (P2.1d): `enroll.pin` bắt buộc.
6. **P4a auto-open:** `device.autoOpen=true` (mặc định) sau bootstrap.
7. Backend + token khoa sẵn sàng.
8. IntelliJ: Main **`com.bv87.fingerprint.agent.FingerprintAgentApp`** (không phải `ZKFPDemo`) — Working directory = `fingerprint-agent`.
9. **P4c — VM options IntelliJ (parity với bat):**

```
-Dfile.encoding=UTF-8
-Djava.library.path=lib;%SystemRoot%\System32
```

Run → Edit Configurations → VM options. Thiếu System32 → `UnsatisfiedLinkError: no libzkfp` (giống bat cũ).

## Phân phối JAR (P4 §9.5.1) — máy khoa không cần IntelliJ

```powershell
cd fingerprint-agent\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\build-agent-jar.ps1
```

Tạo `dist\fingerprint-agent.jar`. `start-agent.bat` **ưu tiên JAR** trước khi tìm `classes\production\…`.

Copy lên PC khoa: `dist\`, `lib\`, `scripts\`, `agent.properties` (+ driver ZK).

### Phát hành ZIP cho PC khoa (IT)

`dist/` và `agent.properties` **không** nằm trong git. Quy trình:

1. Dev: `git commit` / `push` source (không JAR / secrets).  
2. IT: `git pull` → `scripts\build-agent-jar.ps1` → copy folder gồm `dist\`, `lib\`, `scripts\`, `README.md`, `agent.properties.example` (hoặc `agent.properties` đã điền token khoa).  
3. Nén ZIP gửi user. **Không** chỉ `git pull` trên PC khoa nếu chưa build JAR.  
4. User giải nén path cố định (vd. `C:\BV87\fingerprint-agent`) → JDK 17 + driver ZK → PowerShell **Run as administrator**:

```powershell
cd C:\BV87\fingerprint-agent\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\install-autostart.ps1
.\install-watchdog.ps1
```

5. Thử: `.\start-agent-silent.ps1`. Kiểm tra Startup shortcut + Task `BV87-Fingerprint-Agent-Watchdog`. Đổi thư mục cài → chạy lại cả hai install.

Chi tiết thêm: `deploy/README.md` (mục Fingerprint Agent).

## Chạy bằng `start-agent.bat` (debug — có cửa sổ CMD)

```powershell
cd fingerprint-agent\scripts
.\start-agent.bat
```

Thứ tự: (1) `dist\fingerprint-agent.jar` → (2) IntelliJ `classes\` / `out\` / `target` như SPEC §9.4.

`-cp` = JAR hoặc `{classesDir};lib\*` · `-Djava.library.path={abs}\lib;%SystemRoot%\System32`. Preflight `libzkfp.dll`.

**Ops (user khoa):** không dùng bat — dùng `start-agent-silent.vbs` / `start-agent-silent.ps1` (`javaw`, không CMD). Lỗi ghi `logs\silent-start.log`. PID: `logs\agent.pid`.

Silent start: `java.library.path` = `lib` + System32 only; `ProcessStartInfo`; sau 2s ghi PID nếu còn sống. Watchdog/Startup qua **VBS window 0** (không nháy PowerShell).

## Autostart + watchdog (P4a + P4 §9.5.3)

**Không** dùng Windows Service mở Swing (session 0). Autostart/watchdog **ẩn CMD và PowerShell**.

1. Build JAR (hoặc Run IntelliJ một lần).
2. Chỉnh `agent.properties`.
3. PowerShell:

```powershell
cd fingerprint-agent\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\install-autostart.ps1
.\install-watchdog.ps1
```

**Bắt buộc chạy lại** cả hai script sau khi cập nhật VBS/PID.

Nếu `install-watchdog.ps1` báo **Access is denied** khi **tạo** task:
1. Mở PowerShell **Run as administrator**, rồi chạy lại script, **hoặc**
2. Task Scheduler → xóa task (nếu còn) → chạy lại.

Task đã xóa tay trước đó: script **không** còn fail vì `schtasks /Delete` “cannot find”.

```powershell
cd fingerprint-agent\scripts
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-watchdog.ps1
```

Sau đó `Task To Run` phải chứa `wscript.exe` + `watchdog-agent.vbs`.

| Script | Việc |
|--------|------|
| `agent-process.ps1` | Shared: PID file + cmdline detect |
| `start-agent-silent.vbs` / `.ps1` | `javaw` — Startup / watchdog start |
| `watchdog-agent.vbs` / `.ps1` | Task Scheduler mỗi 2 phút (VBS = không flash) |
| `start-agent.bat` | Debug IT — `java` + console |
| `install-autostart.ps1` | Shortcut → `wscript //B start-agent-silent.vbs` |
| `install-watchdog.ps1` | Task → `wscript //B watchdog-agent.vbs` |

## Heartbeat Online (P4 §9.5.2)

Agent gửi `POST /api/kiosk/heartbeat` (mặc định 30s). Admin → Cài đặt → Quản lý token vân tay: cột **Agent** Online/Offline (+ KPI Online).

`agent.properties`: `heartbeat.enabled=true`, `heartbeat.intervalSeconds=30`.

## Luồng vận hành

| Việc | Nơi |
|------|-----|
| Chấm công IN/OUT | Agent mode **Chấm công** |
| Đăng ký / ghi đè / xóa mẫu | Agent **Đăng ký** (PIN) — không Web (P2.3) |
| Xem / báo cáo / Agent Online | Web HEAD / ADMIN |

Demo gốc tham chiếu: `src/com/zkteco/biometric/ZKFPDemo.java`.
