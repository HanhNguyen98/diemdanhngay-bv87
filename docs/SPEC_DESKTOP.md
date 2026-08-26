# SPEC — Desktop Client (WPF)

> **Binding contract** cho client desktop BV87. Mọi thay đổi UI/API desktop phải tuân thủ file này.  
> **Web React và mobile layout đã DEPRECATED** — không deploy sau cutover (phase D5).  
> Nghiệp vụ chi tiết: tham chiếu `SPEC_FINGERPRINT.md`, `SPEC_ADMIN.md`, `SPEC_HEAD.md` (logic/API); UI binding chuyển sang file này.

**Nguồn sự thật (source of truth):**
- Client: `desktop/` — solution WPF (.NET 8), một exe `BV87.exe`
- Backend: Spring Boot — giữ nguyên; API `/api/*` là hợp đồng
- Agent Java (interim): `fingerprint-agent/` — thay bằng mode kiosk WPF ở phase D1

---

## 0. Quy tắc binding

| Rule | Chi tiết |
|------|----------|
| **Web React** | **DEPRECATED** — chỉ tham chiếu chức năng khi port; không maintain sau D5 |
| **Mobile layout** | **Không port** — WPF desktop ≥1280px |
| **AI Trợ lý** | **OUT OF SCOPE** — không gọi `/api/*/ai/**` |
| **Backend** | **Giữ** Spring Boot + MySQL + Flyway |
| **Client** | **1 exe** — 3 mode: `kiosk` \| `head` \| `admin` |
| **Enroll USB** | **Chỉ mode kiosk** — Admin/Head **cấm** enroll (SPEC_FINGERPRINT §4) |
| **Thứ tự** | Cập nhật SPEC → implement → checklist |

---

## 1. Sản phẩm & packaging

| Mục | Giết định |
|-----|-----------|
| Tên exe | `BV87.exe` |
| Framework | **WPF** (.NET 8, `net8.0-windows`) |
| Pattern | MVVM; thư mục `desktop/src/BV87.App`, `desktop/src/BV87.Core` |
| Phân phối | ZIP portable (không MSI bắt buộc D0); kèm `appsettings.json` |
| CLI mode | `BV87.exe --mode=kiosk\|head\|admin` hoặc đọc config đã lưu |
| API base | `ApiBaseUrl` trong config — mặc định local `http://localhost:8082` |

---

## 2. Auth (JWT — D0)

### 2.1 Desktop HEAD / ADMIN

| Endpoint | Mô tả |
|----------|--------|
| `POST /api/auth/desktop/login` | Body `{ username, password }` → `{ accessToken, refreshToken, tokenType, expiresInSeconds, user }` |
| `POST /api/auth/desktop/refresh` | Body `{ refreshToken }` → cặp token mới |
| `GET /api/auth/me` | Header `Authorization: Bearer {accessToken}` → `LoginResponse` |

- Access token: JWT, claim `type=access`, TTL cấu hình `app.security.jwt.access-token-minutes` (mặc định 60 phút)
- Refresh token: JWT, claim `type=refresh`, TTL `app.security.jwt.refresh-token-days` (mặc định 7 ngày)
- Secret: `app.security.jwt.secret` — **bắt buộc** override trên prod (`local-secrets.yml` / env)
- Message lỗi: **tiếng Việt** (giống Web)
- Web session cookie: **giữ** trong giai đoạn chuyển tiếp; desktop **chỉ** JWT

### 2.2 Mode kiosk

| Mục | Quy tắc |
|-----|---------|
| Header | `X-Kiosk-Token` (giữ SPEC_FINGERPRINT) |
| Auth user | Không JWT — token kiosk theo đơn vị |
| PIN enroll | Local Agent / kiosk UI — SPEC_FINGERPRINT §4 |

---

## 3. Mode KIOSK — checklist (D1+)

Tham chiếu `SPEC_FINGERPRINT.md` §9. IDs `K-01` … `K-15`.

- [ ] K-01 Quét vân tay IN/OUT
- [ ] K-02 Hiển thị kết quả quét (tên, mã NV, trạng thái)
- [ ] K-03 Âm thanh OK / lỗi
- [ ] K-04 Đăng ký vân tay (enroll) + PIN
- [ ] K-05 Xóa / cập nhật template (theo SPEC)
- [ ] K-06 Kết nối ZK9500 USB (port C# hoặc interim Java Agent)
- [ ] K-07 Cấu hình token kiosk + `ApiBaseUrl`
- [ ] K-08 Heartbeat kiosk
- [ ] K-09 Offline / lỗi mạng — thông báo VN
- [ ] K-10 Không hiển thị màn Admin/Head

*(Chi tiết đầy đủ: SPEC_FINGERPRINT — port từng mục khi D1.)*

---

## 4. Mode HEAD — checklist (D2+)

Tham chiếu `SPEC_HEAD.md`. Loại trừ §10 AI. IDs `H-01` … `H-44` (rút gọn phase).

- [ ] H-01 Login JWT HEAD
- [ ] H-02 Chấm công ngày — bảng nhân viên đơn vị
- [ ] H-03 Quick status + ghi chú
- [ ] H-04 Khóa sổ 16:00 (`lockTime`) — read-only khi locked
- [ ] H-05 Thống kê + lịch sử
- [ ] H-06 Danh mục nhân viên (read HEAD scope)
- [ ] H-07 Đổi mật khẩu
- [ ] H-08 Thông báo (nếu API có)

---

## 5. Mode ADMIN — checklist (D3–D4+)

Tham chiếu `SPEC_ADMIN.md`. Loại trừ §10 AI + `ClinicalFlowPanel`. IDs `A-01` … `A-55` (rút gọn phase).

- [ ] A-01 Login JWT ADMIN
- [ ] A-02 Dashboard Tổng quan chung
- [ ] A-03 Dashboard Chi tiết đơn vị
- [ ] A-04 Danh mục: Đơn vị, Nhân viên, Cấp bậc, Chức vụ, Trạng thái
- [ ] A-05 Tiện ích: Lịch sử nhắc nhở, Audit, Unlock requests
- [ ] A-06 Cài đặt: Hệ thống, Phân quyền, Token kiosk
- [ ] A-07 Đổi mật khẩu
- [ ] A-08 Export Excel (parity Web)

**P16-DashboardRefreshDup (Web — đã fix, tham chiếu desktop A-02):** toolbar Tiến độ Chấm công chỉ **một** nút **Làm mới**; bộ lọc đơn vị = dropdown + **Tìm kiếm** (icon kính lúp); **cấm** icon `RotateCcw` cạnh Làm mới.

---

## 6. OUT OF SCOPE

- Web React SPA (deploy prod sau D5)
- Mobile drawer / card layout
- AI assistant (`SPEC_AI_ASSISTANT.md`)
- Enroll vân tay trên Admin/Head desktop
- Thay đổi schema nghiệp vụ ngoài JWT auth endpoints

---

## 7. Phases & checklist triển khai

| Phase | Phạm vi | Trạng thái |
|-------|---------|------------|
| **D0** | SPEC này, JWT backend, WPF shell + login + chọn mode | [x] |
| **D0.1** | Token persist, auto-refresh, logout revoke | [ ] |
| **D1** | Mode kiosk parity Agent | [ ] |
| **D2** | Mode HEAD | [ ] |
| **D3** | Admin dashboard + dept detail | [ ] |
| **D4** | Admin catalog + utilities + settings | [ ] |
| **D5** | UAT, gỡ Web prod | [ ] |

### D0 deliverables (done)

- [x] `docs/SPEC_DESKTOP.md` (file này)
- [x] `POST /api/auth/desktop/login`, `POST /api/auth/desktop/refresh`
- [x] `JwtAuthFilter` + cấu hình `app.security.jwt`
- [x] `desktop/BV87.sln` — login JWT, chọn mode, shell placeholder
- [x] P16 Web fix (commit cùng PR)

---

## 8. Cấu trúc solution

```
desktop/
  BV87.sln
  README.md
  src/
    BV87.App/       # WPF — Views, App.xaml, appsettings.json
    BV87.Core/      # ApiClient, AuthService, Config, Models
```

---

## 9. Theme (WPF — tham chiếu)

Port semantic tokens từ `frontend/tailwind.config.js` / `constants/theme.js`:

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#2563EB` | Nút chính, link |
| Navy | `#001A4D` | Tiêu đề |
| Surface page | `#F8F9FA` | Nền |
| Success / Warning / Danger | theo theme.js | Badge trạng thái |

Không hardcode hex rải rác — centralize `ThemeResources.xaml` (D1+).
