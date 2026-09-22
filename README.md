# Hệ thống Bệnh viện Quân y 87 — Chương trình chấm công

Client: **WPF** (`desktop/`). API: **Spring Boot**. Không còn Web React / Java Agent trong repo (D5).

Hướng dẫn ADMIN / HEAD / IT (đóng gói ZIP, Git, deploy): [`docs/HUONG_DAN_SU_DUNG.md`](docs/HUONG_DAN_SU_DUNG.md).

## Cấu trúc

```
diemdanhngay-bv87/
├── backend/          # Spring Boot 3.x — port local 8082
├── desktop/          # WPF BV87.exe (Admin / HEAD / --agent)
├── deploy/           # Docker prod — API LAN :8081
├── docs/             # SPEC + HUONG_DAN_SU_DUNG.md (ADMIN / HEAD / IT)
└── .cursorrules
```

## Yêu cầu

- Java 17+, Maven 3.8+
- .NET 8 **Desktop Runtime** x64 (máy chạy `BV87.exe`)
- MySQL 8.x cổng **3306** (cùng server với web khảo sát)
- Database: **`diemdanhngay_bv87_db`**

### DBeaver

| Tham số | Giá trị |
|---------|---------|
| Host | `localhost` |
| Port | `3306` |
| Database | `diemdanhngay_bv87_db` |
| Username | `root` |

```sql
CREATE DATABASE IF NOT EXISTS diemdanhngay_bv87_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Chạy local

```powershell
# 1. Cấu hình password (một lần)
cd backend
copy local-secrets.example.yml local-secrets.yml
# Sửa spring.datasource.password trong local-secrets.yml

# 2. Backend (tự giải phóng port 8082 trước khi chạy)
.\start.ps1

# 3. Dùng xong — giải phóng port 8082
.\stop.ps1

# 4. WPF (terminal khác)
cd ..\desktop
.\run.cmd
```

Kiosk local: `.\run.cmd --agent` (cần `agent.config.json` cạnh exe).

> Lỗi `Port 8082 was already in use` → chạy `.\stop.ps1` rồi `.\start.ps1` lại.

| Ứng dụng | Profile | DB_NAME | Port |
|----------|---------|---------|------|
| Web khảo sát (app khác) | `mysql` | `fm_db_bv87` | 8080 |
| API chấm công (dev) | `local` | `diemdanhngay_bv87_db` | **8082** |

- WPF: `desktop\run.cmd`
- API: http://localhost:8082

## Tài khoản mẫu

| Vai trò | Username | Mật khẩu |
|---------|----------|----------|
| Admin | admin | admin123 |

HEAD / DUTY: tạo qua **Cài đặt → Phân quyền** (không seed sẵn).

Xóa sạch TK local (giữ `admin`): `scripts/sql/cleanup_non_admin_accounts.sql`.

## Deploy production (LAN)

Xem [`docs/HUONG_DAN_SU_DUNG.md`](docs/HUONG_DAN_SU_DUNG.md) (IT + user) · [`deploy/README.md`](deploy/README.md) · gói WPF: `desktop\scripts\pack-release.ps1`.

| Ứng dụng | Port LAN | Database |
|----------|----------|----------|
| Web khảo sát | `8080` | `fm_db_bv87` |
| API chấm công | `8081` | `diemdanhngay_bv87_db` |

```powershell
cd deploy
copy .env.example .env
# Sửa DB_PASS

docker compose -f docker-compose.prod.yml up -d --build
```

WPF / Agent trỏ `http://192.170.182.14:8081`. **Cấm** Cloudflare Tunnel cho chấm công.

Backup DB hàng ngày (PC server Windows, 22:00): [`deploy/README.md`](deploy/README.md) mục **Backup hàng ngày**.

## Quy tắc dev

- Code & comment method: **tiếng Anh** — xem `docs/CODING_STANDARDS.md`
- Giao diện & thông báo lỗi API: **tiếng Việt**
- `dept_code` / `emp_code`: INT trong DB, hiển thị `%02d` / `%05d`
- Binding UI: `docs/SPEC_DESKTOP.md`
