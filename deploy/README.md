# Deploy Production — Chấm công BV87

## Kiến trúc

```
LAN  : http://192.170.182.14:8081  →  Nginx (frontend)  →  /api  →  Spring Boot
Cloud: https://diemdanh.<domain>   →  cloudflared       →  Nginx :80
MySQL: host MySQL (cùng server khảo sát), DB riêng diemdanhngay_bv87_db
```

Không dùng Ngrok. Cloudflare Tunnel chạy optional qua profile `tunnel`.

**Kiosk / Fingerprint Agent chỉ LAN** (`lan-gate-enabled: true`). Không trỏ `api.baseUrl` Agent qua Cloudflare.

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
# Sửa DB_PASS, APP_CORS_ORIGINS, SESSION_COOKIE_SECURE

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

Truy cập: http://192.170.182.14:8081

## Cloudflare Tunnel

1. Cloudflare Zero Trust → Networks → Tunnels → tạo hoặc dùng tunnel khảo sát
2. Public Hostname mới: `diemdanh.<domain>` → `http://diemdanh-frontend:80`
3. Copy token vào `deploy/.env`: `CF_TUNNEL_TOKEN=...`
4. Thêm domain vào `APP_SECURITY_CORS_ALLOWED_ORIGIN_PATTERNS`
5. Nếu chỉ truy cập qua HTTPS Cloudflare: `SESSION_COOKIE_SECURE=true`

```powershell
docker compose -f deploy/docker-compose.prod.yml --profile tunnel up -d --build
```

## Cookie session

| Truy cập | SESSION_COOKIE_SECURE |
|----------|----------------------|
| LAN HTTP `:8081` | `false` |
| Cloudflare HTTPS | `true` (hoặc dùng HTTPS cả LAN) |

## Kiểm tra sau deploy

- [ ] Login admin / trưởng phòng
- [ ] Chấm công mobile HEAD
- [ ] Dashboard + Trợ lý AI (SSE + Excel)
- [ ] Chuyển đơn vị (POST transfer) + lịch sử Từ→Đến
- [ ] Settings mục 4 khung giờ 4 pha đã Lưu
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

Nếu khung giờ NULL/lệch → Admin Web → **Cài đặt hệ thống** → mục 4 → **Lưu**  
(mặc định SPEC: 07:00 / 11:00 / 13:30 / 16:30 + midpoint / grace).

### 4. Hibernate validate (P7b / P7c)

Entity phải `columnDefinition = "TINYINT(1)…"` khớp Flyway:

- `AttendanceRecord.late_flag` (V18)
- `AttendanceStatusType.active` (V3), `manual_allowed` / `group_parent` (V17)

Thiếu → start fail: schema-validation BIT vs TINYINT.

### 5. Rollback DB

Chỉ **restore dump** backup. Không viết down-migration V18 trên prod nóng nếu chưa rehearsed trên staging.

---

## Fingerprint Agent trên PC khoa (P4a + P4 + P7c)

Web **không** chạy SDK. Mỗi khoa: 1 Windows PC + ZK9500 + Agent (`fingerprint-agent/`).

Chi tiết classpath: `fingerprint-agent/README.md` + `docs/SPEC_FINGERPRINT.md` §9.4–§9.5.

### Build JAR (máy IT)

```powershell
cd …\fingerprint-agent\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\build-agent-jar.ps1
```

Tạo `dist\fingerprint-agent.jar` (gitignored). Copy lên PC khoa: `dist\`, `lib\`, `scripts\`, `agent.properties` (+ driver ZK).

### `agent.properties` (LAN only)

```properties
api.baseUrl=http://192.170.182.14:8081
kiosk.token=<token active từ Admin — Quản lý token vân tay>
enroll.pin=<PIN>
device.autoOpen=true
heartbeat.enabled=true
```

**Cấm** `https://…cloudflare…` cho kiosk.

### Restart Agent sau deploy BE / JAR mới

1. Đóng Agent cũ (cửa sổ / Task Manager `javaw` / `java` FingerprintAgentApp).  
2. Thay `dist\fingerprint-agent.jar` (giữ `.jar.bak` nếu cần rollback).  
3. Debug (có CMD):

```powershell
cd …\fingerprint-agent\scripts
.\start-agent.bat
```

Log: `Using dist\fingerprint-agent.jar` (không classpath IntelliJ cũ).

4. Ops (ẩn CMD):

```powershell
cd …\fingerprint-agent\scripts
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-agent-silent.ps1
```

### Smoke Agent

- Admin: token khoa **Online** (heartbeat ~30–90s).  
- Quét 1 NV → banner tiếng Việt (`VÀO CHIỀU THÀNH CÔNG` / …), **không** raw `AFTERNOON_IN`, **không** `LỖI` do HTTP 500.  
- Nếu `scan API failed: HTTP 500` → log BE (thường schema / settings giờ), không chỉ restart Agent.

### Autostart + watchdog (một lần / sau đổi path)

Trên PC khoa, user đăng nhập hàng ngày (Interactive — **không** Windows Service SYSTEM):

```powershell
cd …\fingerprint-agent\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\install-autostart.ps1
.\install-watchdog.ps1
```

Nếu Access denied khi tạo task: PowerShell **Run as administrator**, chạy lại `install-watchdog.ps1`.

| Thành phần | Hành vi |
|------------|---------|
| Autostart | Startup → `start-agent-silent.vbs` → `javaw` |
| Watchdog | Task `BV87-Fingerprint-Agent-Watchdog` mỗi **2 phút** |
| Cấm | Task Action = `powershell.exe` trực tiếp; Windows Service mở Swing |

**Sau đổi thư mục cài Agent:** chạy lại cả hai script install.

Kiểm tra: tắt Agent tay → ≤2 phút tự mở lại.

---

## Thứ tự cắt gợi ý (1 buổi)

1. Backup DB + ghi `flyway_schema_history`  
2. Deploy BE/FE (`docker compose … --build`) — Flyway V17/V18  
3. Verify SQL + Admin Lưu settings khung giờ  
4. Smoke Web (transfer, attendance, dashboard)  
5. Build JAR Agent → copy PC khoa  
6. Stop Agent cũ → start JAR mới → smoke scan  
7. Re-run `install-watchdog.ps1` (+ autostart nếu path đổi)  
8. Theo dõi 1 ngày: Online token, không 500 scan  

## Rollback nhanh

| Lớp | Cách |
|-----|------|
| App | Image/tag trước hoặc `git checkout` tag cũ + rebuild |
| DB | Restore dump |
| Agent | Copy lại `fingerprint-agent.jar.bak` + start |
