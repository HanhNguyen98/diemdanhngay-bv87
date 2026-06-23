# Hệ thống Chương trình điểm danh

## Cấu trúc dự án

```
diemdanhngay-bv87/
├── backend/                    # Spring Boot 3.x
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-local.yml
│   │   ├── schema.sql
│   │   └── data.sql
│   └── local-secrets.example.yml
├── frontend/                   # React + Vite + Tailwind
├── docs/CODING_STANDARDS.md    # Quy ước code (English) / UI (Tiếng Việt)
└── .cursorrules                # Quy tắc cho AI & dev
```

## Yêu cầu

- Java 17+, Maven 3.8+, Node.js 18+
- MySQL 8.x cổng **3306D** (cùng server với web khảo sát)
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

# 4. Frontend (terminal khác)
cd ..\frontend
npm run dev
```

> Lỗi `Port 8082 was already in use` → chạy `.\stop.ps1` rồi `.\start.ps1` lại.

| Ứng dụng | Profile | DB_NAME | Port |
|----------|---------|---------|------|
| Web khảo sát | `mysql` | `fm_db_bv87` | 8080 |
| Điểm danh | `local` | `diemdanhngay_bv87_db` | **8082** |

- Giao diện: http://localhost:5173
- API: http://localhost:8082

## Tài khoản mẫu

| Vai trò | Username | Mật khẩu |
|---------|----------|----------|
| Admin | admin | admin123 |
| Trưởng phòng 02 | truongphong02 | head123 |

## Deploy production (Docker + Cloudflare)

Xem hướng dẫn chi tiết: [`deploy/README.md`](deploy/README.md)

| Ứng dụng | Port LAN | Database |
|----------|----------|----------|
| Web khảo sát | `8080` | `fm_db_bv87` |
| Điểm danh | `8081` | `diemdanhngay_bv87_db` |

```powershell
# Trên server 192.170.182.14
cd deploy
copy .env.example .env
# Sửa DB_PASS, domain Cloudflare...

docker compose -f docker-compose.prod.yml up -d --build

# Bật Cloudflare Tunnel (sau khi có CF_TUNNEL_TOKEN)
docker compose -f docker-compose.prod.yml --profile tunnel up -d
```

Truy cập LAN: http://192.170.182.14:8081

## Quy tắc dev

- Code & comment method: **tiếng Anh** — xem `docs/CODING_STANDARDS.md`
- Giao diện & thông báo lỗi API: **tiếng Việt**
- `dept_code` / `emp_code`: INT trong DB, hiển thị `%02d` / `%05d`
- Chốt sổ: **16:00** (Asia/Ho_Chi_Minh)
