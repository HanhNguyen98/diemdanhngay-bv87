# Deploy Production — Chấm công BV87

## Kiến trúc (D5)

```
LAN  : http://192.170.182.14:8081  →  Spring Boot (`/api/*`)
MySQL: host MySQL (cùng server khảo sát), DB riêng diemdanhngay_bv87_db
Client: WPF BV87.exe (JWT) + BV87.exe --agent (kiosk token)
```

**Cấm** Nginx SPA, **cấm** Cloudflare Tunnel cho app chấm công. Web khảo sát `:8080` không đụng.

**Kiosk** (`lan-gate-enabled: true`). `apiBaseUrl` Agent = IP LAN `:8081`.

## Chuẩn bị MySQL (chạy một lần trên server)

```sql
CREATE DATABASE IF NOT EXISTS diemdanhngay_bv87_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'diemdanh_user'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON diemdanhngay_bv87_db.* TO 'diemdanh_user'@'%';
FLUSH PRIVILEGES;
```

Chạy `schema.sql` + `data.sql` lần đầu (hoặc migrate từ local). Prod sau đó: **chỉ Flyway** (`ddl-auto: validate`).

## Cấu hình

```powershell
cd deploy
copy .env.example .env
# Sửa DB_PASS

cd ..\backend
copy prod-secrets.example.yml prod-secrets.yml
# Sửa password nếu dùng file secrets thay vì env
```

## Build & chạy (LAN)

Từ thư mục gốc repo:

```powershell
docker compose -f deploy/docker-compose.prod.yml up -d --build
docker compose -f deploy/docker-compose.prod.yml logs -f diemdanh-backend
```

Truy cập API: http://192.170.182.14:8081/api/… (WPF / Agent). Không còn UI web.

WPF chỉ JWT. Không bật Cloudflare Tunnel.

Hướng dẫn ADMIN / HEAD / IT (ZIP, kiosk, Git): [`docs/HUONG_DAN_SU_DUNG.md`](../docs/HUONG_DAN_SU_DUNG.md).

## Kiểm tra sau deploy

- [ ] WPF login ADMIN / HEAD (`BV87.exe`)
- [ ] Agent `BV87.exe --agent` health + quét
- [ ] Dashboard / catalog / enroll USB
- [ ] Task `BV87-DiemDanh-Disk-Status` + `backup\disk-status.json` (banner Tổng quan chỉ khi ổ gần đầy)
- [ ] Web khảo sát `:8080` vẫn hoạt động

## Cập nhật phiên bản

```powershell
git pull
docker compose -f deploy/docker-compose.prod.yml up -d --build
```

---

## Flyway V14 / V17 / V18 (P7 / P7c) — trước & sau cắt

Prod: Flyway **bật**, Hibernate `ddl-auto: validate`. Schema **chỉ** qua migration. Không dựa `ddl-auto: update` như local.

### 0. Backup (bắt buộc)

Dump full `diemdanhngay_bv87_db` trước mọi `docker compose … --build` có migration mới.

Ghi lại history hiện tại:

```sql
USE diemdanhngay_bv87_db;

SELECT version, description, success, checksum, installed_on
FROM flyway_schema_history
ORDER BY installed_rank;
```

### 1. Kiểm tra cột trước migrate

```sql
-- V14: status nullable (OUT-only / chưa chấm)
SHOW COLUMNS FROM attendance_records LIKE 'status';
-- Kỳ vọng: IS_NULLABLE = YES

-- V17: grouping catalog
SHOW COLUMNS FROM attendance_status_types LIKE 'manual_allowed';
SHOW COLUMNS FROM attendance_status_types LIKE 'group_parent';
SHOW COLUMNS FROM attendance_status_types LIKE 'parent_code';

-- V18: 4 punches + late_flag + máy + settings giờ
SHOW COLUMNS FROM attendance_records LIKE 'morning_in_at';
SHOW COLUMNS FROM attendance_records LIKE 'late_flag';
SHOW COLUMNS FROM system_settings LIKE 'morning_in_official';
SHOW COLUMNS FROM fingerprint_scan_logs LIKE 'client_hostname';
```

### 2. Ba tình huống

| Tình huống | Cách xử lý |
|------------|------------|
| **Sạch** — history thiếu V17/V18, cột chưa có | Deploy BE → Flyway chạy V17→V18. Log: `Successfully applied`. |
| **Cột đã có**, history **chưa** ghi V17/V18 | **Không** để Flyway `ADD COLUMN` lại (fail Duplicate column). Staging: so khớp schema với nội dung migration → DBA `flyway repair` / đánh dấu version đã apply (chỉ khi chắc schema ≡ SQL). **Không** sửa checksum migration đã ship trên prod đang chạy. |
| **Cột có nhưng thiếu UPDATE V18** (`morning_in_at` null trong khi `check_in_at` còn dữ liệu) | Chạy **một lần** phần copy: `UPDATE attendance_records SET morning_in_at = check_in_at, afternoon_out_at = check_out_at WHERE morning_in_at IS NULL AND noon_out_at IS NULL AND afternoon_in_at IS NULL AND afternoon_out_at IS NULL;` rồi đánh dấu migrate. |

### 3. Sau migrate — verify

```sql
SELECT COUNT(*) AS legacy_2punch
FROM attendance_records
WHERE morning_in_at IS NOT NULL AND afternoon_out_at IS NOT NULL
  AND noon_out_at IS NULL AND afternoon_in_at IS NULL;

SELECT morning_in_official, midpoint1, midpoint_noon, midpoint2, day_close,
       late_grace_minutes, early_grace_minutes
FROM system_settings WHERE id = 1;

SELECT code, active, manual_allowed, group_parent, parent_code
FROM attendance_status_types
WHERE code IN ('VE_SOM','NGHI_TRUC','NGHI_TRUC_FULL','NGHI_TRUC_HALF','HSQ_BS');
```

Nếu khung giờ NULL/lệch → WPF Admin → **Cài đặt hệ thống** → mục 4 → **Lưu**  
(mặc định SPEC: 07:00 / 11:00 / 13:30 / 16:30 + midpoint / grace).

### 4. Hibernate validate (P7b / P7c)

Entity phải `columnDefinition = "TINYINT(1)…"` khớp Flyway:

- `AttendanceRecord.late_flag` (V18)
- `AttendanceStatusType.active` (V3), `manual_allowed` / `group_parent` (V17)

Thiếu → start fail: schema-validation BIT vs TINYINT.

### 5. Rollback DB

Chỉ **restore dump** backup. Không viết down-migration V18 trên prod nóng nếu chưa rehearsed trên staging.

---

## WPF Agent trên PC khoa (D1.2)

Mỗi khoa: 1 Windows PC + ZK9500 + **BV87.exe --agent** (`desktop/`).

Chi tiết: `desktop/scripts/README.md` + `docs/SPEC_DESKTOP.md` §2.22.

### Copy lên PC khoa

Từ ZIP `pack-release.ps1` **hoặc** build Release thủ công:

- `BV87.exe` + runtime
- `appsettings.json` (Admin/Head — đã cấu hình LAN trong ZIP)
- `lib\` (libzkfpcsharp + ZK)
- `scripts\`
- `agent.config.json.example`

### `agent.config.json` kiosk (LAN only)

```json
{
  "apiBaseUrl": "http://192.170.182.14:8081",
  "kioskToken": "<token active từ Admin — Quản lý token vân tay>",
  "soundEnabled": true,
  "deviceAutoOpen": true,
  "heartbeatEnabled": true
}
```

Tạo nhanh:

```powershell
cd C:\BV87Agent\scripts
.\init-agent-config.ps1 -ApiBaseUrl "http://192.170.182.14:8081" -KioskToken "<token>"
```

**Cấm** commit `agent.config.json` có token thật vào git.

### Restart Agent sau deploy BE / exe mới

1. Đóng Agent cũ (Task Manager `BV87.exe` có `--agent`).
2. Thay `BV87.exe` (+ giữ bản `.bak` nếu cần rollback).
3. Debug (có CMD):

```powershell
cd C:\BV87Agent\scripts
.\start-agent.bat
```

4. Ops (ẩn CMD): `start-agent-silent.ps1` hoặc autostart/watchdog tự xử lý.

### Autostart + watchdog WPF

```powershell
cd C:\BV87Agent\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\install-agent-autostart.ps1
.\install-watchdog.ps1
```

| Thành phần | Hành vi |
|------------|---------|
| Autostart | Startup → `start-agent-silent.vbs` → `BV87.exe --agent` |
| Watchdog | Task `BV87-WPF-Agent-Watchdog` mỗi **2 phút** |

## Java Agent (đã xóa D5)

`fingerprint-agent/` không còn trong repo. Dùng **BV87.exe --agent**. Gỡ task `BV87-Fingerprint-Agent-Watchdog` trên PC khoa nếu còn.

## Rollback nhanh

| Lớp | Cách |
|-----|------|
| App | Image/tag trước hoặc `git checkout` tag cũ + rebuild |
| DB | Restore dump (mục Backup hàng ngày bên dưới) |
| Agent | ZIP WPF trước + `BV87.exe --agent` |

---

## Backup hàng ngày (B-BACKUP) — PC server Windows

Chạy **trên host Windows** (cùng máy MySQL / DBeaver), **không** trong container Spring.

| Mục | Quy tắc |
|-----|---------|
| Path repo | `C:\Users\VNT\diemdanhngay-bv87` |
| Folder | `backup\backup_ddMMyyyy\` (ví dụ `backup\backup_14092026\`) |
| File | `diemdanhngay_bv87_db.sql.gz` + `backup.log` |
| Giờ | Task `BV87-DiemDanh-DB-Backup` **22:00** giờ máy (đặt Windows = VN) |
| Giữ | **7** folder ngày gần nhất — xóa tự động |
| DB | Chỉ `diemdanhngay_bv87_db` (không dump khảo sát) |
| Git | `backup/` gitignored — **cấm** commit dump |

Cảnh báo dung lượng ổ máy chủ (D-DISK.1): host ghi `backup\disk-status.json` mỗi **1 giờ** (task `BV87-DiemDanh-Disk-Status`) và sau dump 22:00. Docker bind-mount `../backup:/app/backup:ro`. Admin Tổng quan chỉ hiện banner khi ổ còn **< 20%** trống (`warning`) hoặc **< 10%** (`danger`) — **không** hiện khi còn đủ chỗ.

Cần **recreate** container sau khi kéo bản có volume: `docker compose -f deploy/docker-compose.prod.yml up -d`.

### Cài một lần (IT)

1. Cài **MySQL client** (`mysqldump.exe`) nếu chưa có trên PATH (DBeaver không thay được).
2. Copy env:

```powershell
cd C:\Users\VNT\diemdanhngay-bv87\deploy\scripts
copy backup.env.example backup.env
notepad backup.env
```

`DB_HOST=127.0.0.1` (script chạy trên host — **không** dùng `host.docker.internal`). Sửa `DB_PASS`.

3. Chạy tay lần đầu:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\backup-diemdanh-db.ps1
```

Kiểm tra `C:\Users\VNT\diemdanhngay-bv87\backup\backup_ddMMyyyy\backup.log` dòng `Backup finished OK`.

4. Gắn lịch 22:00 (dump) **và** 1 giờ (đĩa):

```powershell
.\install-backup-task.ps1
```

Hoặc dump ngay rồi gắn lịch: `.\install-backup-task.ps1 -RunOnce`

Task đĩa: `BV87-DiemDanh-Disk-Status` → `write-disk-status.vbs` (cập nhật JSON mà không dump). Kiểm tra tay: `.\write-disk-status.ps1` → `backup\disk-status.json`.

**Sau đổi đường dẫn clone:** chạy lại `install-backup-task.ps1`.

### Restore (sập / hỏng migration)

1. `docker compose -f deploy/docker-compose.prod.yml stop diemdanh-backend`
2. Giải nén gzip → import:

```powershell
# Cần gzip hoặc 7-Zip; ví dụ với tar Windows 10+
tar -xf C:\Users\VNT\diemdanhngay-bv87\backup\backup_14092026\diemdanhngay_bv87_db.sql.gz
mysql -h 127.0.0.1 -u diemdanh_user -p diemdanhngay_bv87_db < diemdanhngay_bv87_db.sql
```

3. `docker compose -f deploy/docker-compose.prod.yml start diemdanh-backend`

Dump trên **cùng PC** không chống cháy máy — copy USB/PC khác khi có điều kiện (B3).

