# Hướng dẫn sử dụng — Chấm công BV87

Ứng dụng desktop: **`BV87.exe`**. Máy chủ LAN: **`http://192.170.182.14:8081`**.  
Cần Windows 10/11, mạng nội bộ viện, **.NET 8 Desktop Runtime x64**.  
**Cấm** truy cập qua Internet / Cloudflare.

| Ai | Chạy gì |
|----|---------|
| Quản trị viên (ADMIN) | `BV87.exe` → đăng nhập tài khoản ADMIN |
| Trưởng đơn vị (HEAD) | `BV87.exe` → đăng nhập tài khoản HEAD |
| Máy quét vân tay (kiosk) | `BV87.exe --agent` (không đăng nhập) |
| IT | Đóng gói ZIP, cài kiosk, Git + Docker trên server |

**Một gói ZIP** dùng cho ADMIN, HEAD và kiosk. User **không** nhận thư mục source (`src/`, `backend/`).

Tài liệu kỹ thuật: [`SPEC_DESKTOP.md`](SPEC_DESKTOP.md) · cài kiosk: [`desktop/scripts/README.md`](../desktop/scripts/README.md) · server: [`deploy/README.md`](../deploy/README.md).

---

## 1. ADMIN — Quản trị viên

**Phạm vi:** toàn viện. Sau đăng nhập vào **Tổng quan chung**.

### 1.1 Menu

**Bảng điều khiển**

| Mục | Việc làm |
|-----|----------|
| **Tổng quan chung** | KPI toàn viện, tiến độ từng đơn vị, **Gửi nhắc nhở**, lọc đơn vị, **Làm mới**. Cột **Quản lý**: xem chi tiết, khóa/mở sổ, khóa/mở chỉnh sửa HEAD |
| **Chi tiết đơn vị** | Roster theo khoa và ngày; mở khóa ngày; xuất báo cáo; chấm nhanh / điền giờ khi được phép |

**Danh mục hành chính** — Đơn vị · Nhân viên · Cấp bậc · Chức vụ · Trạng thái chấm công.

**Tiện ích** — Yêu cầu mở khóa · Nhật ký chỉnh sửa · Lịch sử vân tay · **Đăng ký vân tay** · Lịch sử nhắc nhở.

**Cài đặt** — Phân quyền · **Token Kiosk** · Hệ thống (giờ làm / khóa sổ) · Đổi mật khẩu.

### 1.2 Việc làm thường xuyên

| Việc | Cách |
|------|------|
| Xem viện đã chấm xong chưa | Tổng quan → cột tiến độ / **HOÀN THÀNH** |
| Nhắc trưởng khoa | Tổng quan → **Gửi nhắc nhở** → chọn từng đơn vị trên ngày đang xem. **Không** tự gửi theo giờ cố định |
| Tạo tài khoản HEAD | Cài đặt → Phân quyền (mỗi đơn vị tối đa **1** HEAD đang hoạt động, bắt buộc gắn mã NV) |
| Cấp máy quét | Cài đặt → Token Kiosk → phát hành token → **gửi token cho IT** (không đưa lên Git) |
| Đăng ký vân tay NV | Tiện ích → Đăng ký vân tay → USB ZK9500 → quét 3 lần → đặt nhãn ngón tay |
| Duyệt HEAD xin mở khóa | Tiện ích → Yêu cầu mở khóa |
| Banner vàng/đỏ trên Tổng quan | Ổ **máy chủ** gần đầy (còn &lt; 20% hoặc &lt; 10% trống). Xóa backup cũ hoặc dọn Docker. **Không** hiện khi ổ còn đủ chỗ. HEAD không thấy banner này |

### 1.3 Không làm

- Không cấp token kiosk vào tin nhắn công khai nếu có thể tránh.
- Không đăng ký vân tay trên cửa sổ `BV87.exe --agent` — chỉ dùng **Tiện ích → Đăng ký vân tay** sau khi đã đăng nhập.
- Không trỏ `appsettings.json` sang URL Internet.

---

## 2. HEAD — Trưởng đơn vị

**Phạm vi:** **chỉ đơn vị gắn trên tài khoản**. Không vào được menu Admin.

### 2.1 Menu

| Mục | Việc làm |
|-----|----------|
| **Chấm công** | Bảng nhân viên theo ngày, chấm nhanh, nghỉ trực (wizard), khóa sổ khi xong |
| **Thống kê** | KPI và lịch sử chấm công đơn vị |
| **Nhân viên** | Danh mục nhân viên đơn vị; xóa mẫu vân tay nếu cần (đăng ký lại ở Tiện ích) |
| **Tiện ích → Đăng ký vân tay** | USB ZK9500 — chỉ nhân viên đơn vị mình |
| **Đổi mật khẩu** | Đổi mật khẩu tài khoản HEAD |

### 2.2 Việc làm hàng ngày

1. Mở `BV87.exe`, đăng nhập tài khoản trưởng đơn vị.
2. Vào **Chấm công**, kiểm tra **ngày hôm nay**.
3. Nhân viên quét máy kiosk sẽ lên giờ; phần còn thiếu chấm tay (nghỉ phép, công tác, nghỉ trực, …).
4. Khi đủ dữ liệu → **khóa sổ**. Sau giờ khóa hệ thống, có thể không ghi được ngày hôm nay trừ khi Admin mở khóa / duyệt yêu cầu.
5. Nhân viên mới: **Tiện ích → Đăng ký vân tay**. Nếu máy kiosk cùng PC đang mở Agent, app tự nhường USB — **không** cần tắt cửa sổ kiosk.

### 2.3 Không làm

- Không xem hoặc sửa khoa khác.
- Không dùng mật khẩu HEAD để chạy `--agent` — máy quét dùng **token kiosk** do Admin cấp.

---

## 3. IT — Đóng gói, giao user, server

### 3.1 Gửi user cái gì

**Không gửi source** (`src/`, `backend/`, `.git/`). User nhận **ZIP exe**.

Trên máy có .NET 8 SDK:

```powershell
cd desktop\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\pack-release.ps1
```

File giao: `desktop\dist\BV87-Desktop-YYYYMMDD.zip`  
URL trong ZIP lấy từ `desktop\deploy.defaults.json` (mặc định `http://192.170.182.14:8081`).

| Trong ZIP | Ai dùng |
|-----------|---------|
| `BV87.exe` + DLL + `lib\` | Tất cả |
| `appsettings.json` (`LanOnlyEnabled: true`, URL LAN) | ADMIN / HEAD |
| `HUONG-DAN-CAI-DAT.txt` | Cài đặt nhanh trên máy user — UTF-8 BOM + path đầy đủ (`C:\BV87\`, `C:\BV87Agent\scripts\`) |
| `scripts\` | IT cài kiosk |
| `agent.config.json.example` | Mẫu kiosk |

**Không gửi / không copy vào USB user**

- `desktop\src\BV87.App\bin\Debug\` (bản dev: `localhost:8082`, `LanOnlyEnabled: false`)
- Folder test `BV87-Desktop-test`
- `agent.config.json` đã có token thật
- `local-secrets.yml`, `prod-secrets.yml`, `deploy/.env`, `backup.env`, thư mục `backup\`
- Source `src/`, `backend/`, `.git/`

Máy user cần **.NET 8 Desktop Runtime x64** (ZIP không kèm runtime).

| Máy | Gợi ý giải nén | Chạy |
|-----|----------------|------|
| Admin / văn phòng | `C:\BV87\` | `BV87.exe` |
| Trưởng đơn vị | `C:\BV87\` | `BV87.exe` |
| Kiosk ZK9500 | `C:\BV87Agent\` | IT tạo `agent.config.json` rồi `BV87.exe --agent` |

### 3.2 Cài máy kiosk (một lần / máy)

Token: Admin → **Cài đặt → Token Kiosk**.

```powershell
cd C:\BV87Agent\scripts
Set-ExecutionPolicy -Scope Process Bypass
.\init-agent-config.ps1 -ApiBaseUrl "http://192.170.182.14:8081" -KioskToken "<token Admin cấp>"
.\install-agent-autostart.ps1
.\install-watchdog.ps1
```

- User Windows phải **đăng nhập** (không phải Windows Service).
- Mỗi máy chỉ **một** process `BV87.exe --agent`.
- Gỡ Java `fingerprint-agent` / task watchdog JAR cũ nếu còn.
- Sau đổi thư mục cài: chạy lại hai script `install-*.ps1`.

Kiểm tra: Admin thấy token **Online**; cắm ZK9500; quét 1 NV → banner tiếng Việt + tiếng bíp.

Chi tiết: [`desktop/scripts/README.md`](../desktop/scripts/README.md).

### 3.3 Server Windows (`DESKTOP-H5KU130`)

| Mục | Giá trị |
|-----|---------|
| Clone | `C:\Users\VNT\diemdanhngay-bv87` |
| API LAN | `http://192.170.182.14:8081` |
| MySQL | host `:3306`, DB `diemdanhngay_bv87_db` |
| Khảo sát (app khác) | `:8080` — không đụng |

**Cấm** Cloudflare Tunnel / `docker compose --profile tunnel`.

Cập nhật phiên bản:

```powershell
cd C:\Users\VNT\diemdanhngay-bv87
git pull
docker compose -f deploy/docker-compose.prod.yml up -d --build
```

Lần đầu / sau khi thêm volume backup (banner dung lượng ổ):

1. `deploy/.env` (copy từ `.env.example`) — đặt `DB_PASS`.
2. `deploy/scripts/backup.env` — dump MySQL 22:00 (`DB_HOST=127.0.0.1`).
3. `.\install-backup-task.ps1` — task dump **và** `BV87-DiemDanh-Disk-Status` (mỗi 1 giờ).
4. Recreate compose để mount `../backup:/app/backup:ro`.

Cần `mysqldump.exe` trên host (DBeaver không thay được). Chi tiết: [`deploy/README.md`](../deploy/README.md).

**Sau deploy kiểm tra**

- [ ] Login ADMIN / HEAD trên `BV87.exe`
- [ ] Agent `--agent` heartbeat Online + quét được
- [ ] Tổng quan / danh mục / đăng ký vân tay USB
- [ ] File `backup\disk-status.json` (banner Tổng quan chỉ khi ổ gần đầy)
- [ ] Web khảo sát `:8080` vẫn chạy

### 3.4 Cập nhật exe trên máy user

Chỉ khi có thay đổi WPF: pack ZIP mới → copy đè `C:\BV87` / `C:\BV87Agent`.  
**Giữ** `agent.config.json` trên kiosk. **Đóng** `BV87.exe` trước khi copy.

---

## 4. Commit source lên Git rồi deploy server

User **không** nhận commit. Git chỉ cho IT / máy chủ.

### 4.1 Không commit

`backend/target/` · `desktop/**/bin` · `desktop/**/obj` · `desktop/dist/` · `backup/` · `.env` · `backup.env` · `local-secrets.yml` · `prod-secrets.yml` · `agent.config.json` có token.

### 4.2 Gợi ý tách commit

Working tree lớn thì **nhiều commit nhỏ**, mỗi cái deploy được — không gộp D5 + backup + UI vào một commit.

| # | Nội dung | Gợi ý message (tiếng Anh, vì sao) |
|---|---------|-----------------------------------|
| 1 | Cắt web/Java agent, JWT desktop, Docker chỉ Spring `:8081` | `cut over to WPF and JWT-only API on LAN 8081` |
| 2 | Backup MySQL 22:00 trên host Windows, giữ 7 ngày | `add daily host MySQL dump at 22:00 with 7-day retention` |
| 3 | Banner đĩa Admin + JSON hourly + volume Docker | `show admin disk banner only when host C: is nearly full` |
| 4 | Phần UI WPF còn lại (nếu chưa nằm trong 1–3) | tách theo màn hình |

### 4.3 Thứ tự an toàn

1. `git status` / `git diff` — loại secret.
2. Commit + push (nhánh theo quy trình viện).
3. **Trên server:** dump DB (hoặc đợi backup 22:00) **trước** `compose --build` nếu có Flyway mới.
4. `git pull` → `docker compose -f deploy/docker-compose.prod.yml up -d --build`.
5. Smoke test mục 3.3.
6. Máy user: pack ZIP mới **chỉ** khi đổi WPF; kiosk giữ `agent.config.json`.

**Rollback:** checkout tag/commit cũ + rebuild; DB chỉ **restore dump** trong `backup\backup_ddMMyyyy\`; Agent giữ ZIP exe trước.

---

## 5. Sự cố thường gặp

| Hiện tượng | Hướng xử lý |
|------------|-------------|
| Không mở được app / thiếu runtime | Cài .NET 8 **Desktop Runtime** x64 |
| Đăng nhập được nhưng không gọi API | PC phải trong LAN viện; `appsettings.json` đúng `http://192.170.182.14:8081` |
| Agent không Online | Token hết hạn/thu hồi; sai `kioskToken`; firewall; chưa chạy `--agent` |
| USB “máy khác đang giữ” | Cùng PC: mở **Đăng ký vân tay** thì Agent tự nhường; không chạy hai `--agent` |
| Không ghi chấm công hôm nay | Đã qua giờ khóa / Admin đã khóa chỉnh sửa HEAD — liên hệ Admin |
| Banner ổ đĩa trên Tổng quan | Chỉ ADMIN; ổ **server** gần đầy — không phải ổ PC đang ngồi |

Lab local (dev): tài khoản mẫu trong [`README.md`](../README.md) — **đổi mật khẩu** trên production.
