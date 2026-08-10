# Deploy Production — Chấm công BV87

## Kiến trúc

```
LAN  : http://192.170.182.14:8081  →  Nginx (frontend)  →  /api  →  Spring Boot
Cloud: https://diemdanh.<domain>   →  cloudflared       →  Nginx :80
MySQL: host MySQL (cùng server khảo sát), DB riêng diemdanhngay_bv87_db
```

Không dùng Ngrok. Cloudflare Tunnel chạy optional qua profile `tunnel`.

## Chuẩn bị MySQL (chạy một lần trên server)

```sql
CREATE DATABASE IF NOT EXISTS diemdanhngay_bv87_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'diemdanh_user'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON diemdanhngay_bv87_db.* TO 'diemdanh_user'@'%';
FLUSH PRIVILEGES;
```

Chạy `schema.sql` + `data.sql` lần đầu (hoặc migrate từ local).

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
- [ ] Web khảo sát `:8080` vẫn hoạt động

## Cập nhật phiên bản

```powershell
git pull
docker compose -f deploy/docker-compose.prod.yml up -d --build
```

## Fingerprint Agent trên PC khoa (P4a)

Web **không** chạy SDK. Mỗi khoa: 1 Windows PC + ZK9500 + Agent (`fingerprint-agent/`).

1. Cài JDK 17+, driver ZK, copy `agent.properties` (token + PIN từ Admin → Cài đặt → Quản lý token vân tay).  
2. `api.baseUrl` = BE LAN (vd. `http://192.170.182.14:8081` hoặc cổng API thực tế).  
3. Autostart: `install-autostart.ps1` → `wscript //B start-agent-silent.vbs` (`javaw`, không flash). Debug: `start-agent.bat`. Build JAR: `scripts/build-agent-jar.ps1`.  
4. Watchdog (crash): `install-watchdog.ps1` → Task Scheduler `wscript //B watchdog-agent.vbs` mỗi 2 phút (+ PID `logs/agent.pid`).  
5. `device.autoOpen=true` — mở Agent là tự kết nối máy quét.  

Chi tiết classpath / runbook: `fingerprint-agent/README.md` + `docs/SPEC_FINGERPRINT.md` §9.4–§9.5.
