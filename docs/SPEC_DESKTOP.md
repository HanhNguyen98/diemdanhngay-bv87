# SPEC — Desktop Client (WPF)

> **Binding contract** cho client desktop BV87. Mọi thay đổi UI/API desktop phải tuân thủ file này.  
> **D5:** Web React (`frontend/`) và Java Agent (`fingerprint-agent/`) **đã xóa khỏi repo** — không deploy.  
> Nghiệp vụ chi tiết: tham chiếu `SPEC_FINGERPRINT.md`, `SPEC_ADMIN.md`, `SPEC_HEAD.md` (logic/API); UI binding chuyển sang file này.

**Nguồn sự thật (source of truth):**
- Client: `desktop/` — solution WPF (.NET 8), một exe `BV87.exe`
- Backend: Spring Boot — giữ nguyên; API `/api/*` là hợp đồng
- Prod LAN: `http://192.170.182.14:8081` → **Spring Boot trực tiếp** (không Nginx SPA)

---

## 0. Quy tắc binding

| Rule | Chi tiết |
|------|----------|
| **Web React** | **Đã xóa** khỏi repo (D5) — **cấm** thêm SPA |
| **Mobile layout** | **Không port** — WPF desktop ≥1280px |
| **AI Trợ lý** | **Đã xóa** `/api/*/ai/**` (D5) — không gọi, không thêm lại |
| **Backend** | **Giữ** Spring Boot + MySQL + Flyway |
| **Client** | **1 exe** — mode `head` \| `admin` (JWT); **cấm** kiosk không đăng nhập trên login (D1.1) |
| **Enroll USB** | **WPF** sau login — Admin/HEAD → **Tiện ích → Đăng ký vân tay** (§2.17.7); JWT API, không PIN kiosk |
| **Quét IN/OUT** | `BV87.exe --agent` (§2.22) — **không** trên login; **cấm** Java agent trong repo |
| **Thứ tự** | Cập nhật SPEC → implement → checklist |

---

## 1. Sản phẩm & packaging

| Mục | Quy định |
|-----|-----------|
| Tên exe | `BV87.exe` |
| Framework | **WPF** (.NET 8, `net8.0-windows`) |
| Pattern | MVVM; thư mục `desktop/src/BV87.App`, `desktop/src/BV87.Core` |
| Phân phối | ZIP portable (`desktop/scripts/pack-release.ps1`); kèm `appsettings.json` + `scripts/` |
| CLI mode | Admin/HEAD: `BV87.exe` (login) hoặc `--mode=admin\|head` · Kiosk quét: **`BV87.exe --agent`** — **cấm** `--mode=kiosk` |
| API base | `ApiBaseUrl` / `apiBaseUrl` — **prod LAN** `http://192.170.182.14:8081`; dev local `http://localhost:8082` |
| LAN only | `lanOnlyEnabled: true` trên gói phân phối — client **cấm** trỏ API public/Cloudflare; parity CIDR §8.1 |
| Một exe | Admin + Head (login JWT) + Agent (`--agent`) — cùng `BV87.exe` |
| **Cấm public** | **Không** Cloudflare tunnel / Internet cho chấm công — DB + API chỉ server LAN |

### 1.1 Triển khai LAN (bệnh viện)

| Mục | Quy tắc |
|-----|---------|
| Server | 1 máy LAN: Spring Boot + MySQL — **cấm** Cloudflare Tunnel / SPA Nginx |
| Cổng LAN (D5) | Docker publish **`${ATTENDANCE_PORT:-8081}:8080`** trên `diemdanh-backend` — WPF/Agent gọi `/api/*` thẳng Spring |
| Client → Server | HTTP tới `ApiBaseUrl` (Admin/Head) hoặc `apiBaseUrl` (Agent) — IP nội bộ |
| Phân phối user | IT chạy `pack-release.ps1` → ZIP **một gói** gửi Admin + HEAD + Agent |
| Cấu hình | ZIP: `appsettings.json` (`LanOnlyEnabled: true`) + `agent.config.json.example`; kiosk: `init-agent-config.ps1` |
| Chặn Internet (client) | `LanEndpointGuard` + **Release exe** (`LanDeploymentPolicy`) — **không** tắt được bằng sửa config |
| Chặn Internet (server) | `KioskLanGateFilter` — `/api/kiosk/**` chỉ CIDR LAN (prod `lan-gate-enabled: true`) |
| Truy cập dữ liệu | Trong LAN + đăng nhập JWT (Admin/HEAD) hoặc token kiosk (Agent) |
| Dev local | Repo `Debug` + `lanOnlyEnabled: false` + `localhost:8082` |

**Deliverables packaging**

- [x] `deploy.defaults.json` — URL LAN mặc định bệnh viện
- [x] `appsettings.lan.example.json` · `agent.config.lan.example.json`
- [x] `pack-release.ps1` — ZIP portable Release (Admin + HEAD + Agent)
- [x] `LanEndpointGuard` (Core)
- [x] D1.3 `LanDeploymentPolicy` — Release build **bắt buộc** `LanOnlyEnabled=true` (§1.1)

**Checklist IT trước giao user**

- [ ] `pack-release.ps1` Release — không gửi folder dev / `BV87-Desktop-test`
- [ ] Server Docker **không** `--profile tunnel`
- [ ] Firewall: MySQL không expose ra ngoài LAN
- [ ] ZIP có `LanOnlyEnabled: true` và `ApiBaseUrl` LAN đúng IP viện
- [ ] Kiosk: `init-agent-config.ps1 -KioskToken "..."` trên từng máy quét
- [ ] PC kiosk: .NET 8 **Desktop Runtime** x64 (ZIP không self-contained)
- [ ] Gỡ Java `fingerprint-agent` / task watchdog JAR cũ trên cùng PC
- [ ] Một process `BV87.exe --agent` / máy (D1.2f)
- [ ] Server Windows: backup DB 22:00 — `deploy/scripts/install-backup-task.ps1` (giữ 7 ngày; task đĩa 1 giờ)
- [ ] Hướng dẫn user/IT: `docs/HUONG_DAN_SU_DUNG.md` (gửi ZIP exe, không gửi `src/`)

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
- Message lỗi: **tiếng Việt**
- Auth: **chỉ JWT** desktop — **cấm** `POST /api/auth/login` session cookie (D5)

### 2.1.1 Auth precedence — JWT vs Web session (D-AUTH.1)

Web và WPF có thể cùng `ApiBaseUrl` (dev `localhost:8082`, prod LAN) mà **không xung đột** session.

| ID | Quy tắc |
|----|---------|
| D-AUTH.1a | Request có `Authorization: Bearer` + access JWT hợp lệ → **luôn** đặt `SecurityContext` theo JWT (**ghi đè** session cookie Web nếu có) |
| D-AUTH.1b | WPF `HttpClient` **cấm** `UseCookies` — không gửi/nhận cookie HTTP server |
| D-AUTH.1c | `POST /api/auth/desktop/login` **cấm** tạo HTTP session (giữ hiện trạng) |
| D-AUTH.1d | HTTP 403 do role → message VN (`Không có quyền truy cập` hoặc message nghiệp vụ); **cấm** trả raw `Access Denied` cho UI |
| D-AUTH.1e | Regression: session Web HEAD + Bearer JWT ADMIN → `/api/admin/**` **200** |

**Deliverables D-AUTH.1**

- [x] `JwtAuthFilter` — Bearer override session
- [x] `JsonSecurityHandlers` — map 403 EN → VN
- [x] `Bv87HttpClientFactory` + `KioskApiClient` — `UseCookies = false`
- [x] `JwtAuthFilterTest` — unit regression

---

| Mục | Quy tắc |
|-----|---------|
| Lưu session | `%AppData%/BV87/session.json` — `accessToken`, `refreshToken`, `accessTokenExpiresAtUtc`, `user`, `lastMode` |
| Khởi động | **Luôn** mở `LoginWindow` — user phải đăng nhập thủ công; **cấm** tự vào shell dù `session.json` còn hợp lệ |
| Auto-refresh | Trước mỗi API: nếu access token còn **&lt; 5 phút** → `POST /api/auth/desktop/refresh` |
| 401 retry | Một lần refresh + gửi lại request; thất bại → xóa session, về login |
| Đăng xuất | Xóa `session.json` + clear memory; **không** gọi server revoke (D0.1) |
| Kiosk | **Đã bỏ** khỏi login (D1.1). Token kiosk chỉ dùng cho `BV87.exe --agent` |

### 2.3.1 Chế độ sau đăng nhập (D0.3)

| Mục | Quy tắc |
|-----|---------|
| ADMIN | Login thành công → **thẳng** `MainShellWindow` mode **admin** — **cấm** màn chọn mode |
| HEAD | Login thành công → **thẳng** `MainShellWindow` mode **head** |
| Kiosk login | **Cấm** — không nút «Chế độ kiosk» trên login |
| Khôi phục session | **Không** tự mở shell lúc khởi động; sau **Đăng nhập** thành công → mở shell theo `user.role` (hoặc `lastMode` nếu có) |
| CLI | `BV87.exe --mode=admin\|head` override; **`--mode=kiosk` bị bỏ qua** (không mở shell kiosk) |
| `ModeSelectWindow` | **Đã xóa** (D5) — login gọi `OpenShellAfterLogin` (CLI `--mode` hoặc `OpenShellForCurrentUser`) |


| Mục | Quy tắc |
|-----|---------|
| Component | `MainShellWindow` — sidebar trái + header + vùng nội dung |
| **Kích thước màn chính** | `MainShellWindow` mở **`WindowState=Maximized`** — phủ toàn bộ vùng làm việc desktop Windows hiện tại (không fixed 1280×720) |
| Min size | 960×600 khi user restore/downsize — **không** layout mobile |
| Theme | `Resources/ThemeResources.xaml` — semantic tokens từ `theme.js` |
| Typography (D1.1u) | Font mặc định **Times New Roman** — token `AppFontFamily` trong `ThemeResources.xaml`; implicit style `App.xaml` cho `Control` / `TextBlock` / `TextBox` / `Label` / `ComboBox` |
| Text crisp (D1.1w) | **Bắt buộc** `TextOptions.TextFormattingMode=Display` + `TextOptions.TextRenderingMode=ClearType` trên implicit text controls + `Window`/`UserControl` root · **cấm** gắn trên `<Application>` · `UseLayoutRounding` + `SnapsToDevicePixels` trên shell/page · form card `CardBorderFlatStyle` (**cấm** `DropShadowEffect` trên card form — gây nhòe chữ WPF) |
| Font size (D1.1u) | Scale token — `FontSizeBase`=17, `FontSizeSm`=14, `FontSizeMd`=16, `FontSizeLg`=19, `FontSizeXl`=27 (+2pt lần 2, D1.1v) |
| Icon font (D1.1u) | **Giữ** `Segoe MDL2 Assets` (`IconFont`) — sidebar glyph, không đổi sang Times New Roman |
| MessageBox (D1.1u) | Dialog hệ thống Windows — font OS mặc định (Segoe UI); không custom trong ticket này |
| Nav HEAD | Chấm công · Thống kê · Nhân viên · **Tiện ích** (Đăng ký vân tay) · Đổi mật khẩu |
| Nav ADMIN | Tổng quan · Chi tiết đơn vị · Danh mục… · Cài đặt (placeholder D3–D4) |
| Nav KIOSK | **Không** — quét IN/OUT chỉ `BV87.exe --agent` (§2.22) |

### 2.6 Branding & logo (D0.2 + D5.5)

| Mục | Quy tắc |
|-----|---------|
| Nguồn chính | `GET /api/public/branding` — `portalTitle`, `logoUrl`, `loginAvatarUrl` (data URL, parity Web `AppBrandingContext`) |
| Fallback | **`Resources/Images/hospital-logo.png`** (bundled, cùng nguồn `fingerprint-agent/src/branding/hospital-logo.png`) + `DefaultPortalTitle` **BỆNH VIỆN QUÂN Y 87** khi API/cache trống hoặc lỗi mạng |
| Cache offline | `%LocalAppData%/BV87/branding-cache.json` — lần tải API thành công cuối |
| Service | `AppBrandingService` + `PublicApiClient` — `EnsureLoadedAsync` lúc startup; `ReloadAsync` sau **Lưu cài đặt** Hệ thống |
| Component | `Controls/HospitalLogo` — logo + phụ đề động |
| Vị trí bắt buộc | Sidebar `MainShellWindow`, màn **Đăng nhập** |
| Login WPF | Ảnh nền full-window từ `loginAvatarUrl` + overlay 25% đen (parity `LoginPage.jsx`); header: logo + `portalTitle` + phụ đề **Chương trình chấm công** |
| Icon cửa sổ — chrome | `MainShellWindow`, `LoginWindow`, `AgentScanWindow` — **chỉ** logo bundled `Resources/Images/hospital-logo.png` (`WindowBrandingHelper.ApplyHospitalIcon`) · **cấm** `logoUrl` API trên title bar · **cấm** icon Windows mặc định |
| Icon cửa sổ — dialog (D-UI.35) | Mọi `*Dialog` module chính — **Window.Icon** = glyph **Segoe MDL2 Assets** (cùng họ sidebar `ShellNavIcons`) render 32px (`WindowBrandingHelper.ApplyGlyphIcon`) · gán **trước** `ShowDialog` (`Initialized` / constructor — **cấm** chờ `Loaded`) · **cấm** logo BV trên title bar dialog · **cấm** icon Windows mặc định · map: `DialogWindowIcons` §2.6.1 |
| MessageBox icon | `Show(owner)` thừa hưởng icon chủ (dialog → glyph; shell → logo BV) |
| Title bar | **Một** câu cố định `ShellUiStrings.WindowTitle` = **`BVQY87 - Chương trình chấm công`** — **cấm** `BV87 — Trưởng đơn vị` / `BV87 — Quản trị viên` / `BV87 — {portalTitle}` trên `MainShellWindow` và `LoginWindow` |
| Cấm | Text **`BV87`** làm logo/wordmark thay ảnh |
| MessageBox title (D-UI.34) | **Cấm** caption `BV87` / `BV87 — …` · xác nhận (Yes/No, OK/Cancel) → **`XÁC NHẬN`** · cảnh báo / lỗi / OK-only → **`CẢNH BÁO`** · `AppMessageBox` + `ShellUiStrings` |
| Refresh sau Lưu | `SystemSettingsViewModel` → `App.Branding.ReloadAsync()` → `ApplyToOpenWindows()` (login đang mở, shell sidebar, mode select) — **không** đổi title bar theo branding · **cấm** ghi đè `Window.Icon` dialog bằng logo BV |

#### 2.6.1 Dialog title-bar glyphs (D-UI.35)

Glyph = `ShellNavIcons.GetGlyph(navId)` trừ khi ghi chú mã riêng. Font `IconFont` (Segoe MDL2 Assets); nền tròn `PrimaryBrush` + glyph trắng 32px.

| Dialog | Glyph | Nguồn |
|--------|-------|--------|
| `ManualRangeDialog` · `ManualScheduleDialog` | `E787` | nav `attendance` |
| `NghiTrucAssignDialog` | `E708` | in-dialog header |
| `SimpleInputDialog` | `E70F` | edit / giải trình |
| `ScanLogDialog` | `E7BA` | nav `audit-logs` |
| `FillAttendanceTimesDialog` | `E823` | clock |
| `ApprovePayrollFillDialog` | `E73E` | check |
| `ClearAttendanceDialog` | `E74D` | delete |
| `ReminderDialog` | `E715` | nav `reminder-history` |
| `StaffAvatarDialog` | `E77B` | Contact (header in-dialog) |
| `StaffCatalogFormDialog` · `StaffTransferDialog` · `StaffTransferHistoryDialog` | `E716` | nav `staff` |
| `DepartmentCatalogFormDialog` · `DepartmentGroupFormDialog` · `DepartmentGroupManageDialog` | `E821` | nav `departments` |
| `StaffAttributeCatalogFormDialog` (cấp bậc) | `E82F` | nav `ranks` |
| `StaffAttributeCatalogFormDialog` (chức vụ) | `E779` | nav `positions` |
| `AttendanceStatusCatalogFormDialog` | `E734` | nav `statuses` |
| `FingerLabelDialog` | `E962` | nav `fingerprint-enroll` |
| Token kiosk (`Issue` / `Issued` / `Pin` / `Label`) | `E7F8` | nav `settings-kiosk` |
| `AccountFormDialog` | `E72C` | nav `settings-permissions` |
| `ResetPasswordDialog` | `E72E` | nav `password` |
| `UnlockRejectDialog` | `E785` | nav `unlock-requests` |
| Dialog chưa map | `E81E` | `ShellNavIcons` default |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.35 | Dialog `Window.Icon` = glyph MDL2 — không logo BV | [x] |

### 2.7 Design system & Shell v2 (D-UI)

Tham chiếu mockup admin dashboard (sidebar + header sáng + card + bảng). **Không** port layout mobile.

| Mục | Quy tắc |
|-----|---------|
| Shell header | Nền **trắng**, viền dưới `LineBrush`; **cấm** header navy full-width (D-UI trở đi) |
| Sidebar | Rộng **260px**; logo bệnh viện; nav **icon + nhãn**; mục active = nền `SidebarActiveBrush` + **thanh primary 3px trái** |
| Header phải | Avatar chữ cái + tên user + nút đăng xuất (icon/text) |
| Content | Nền `SurfacePageBrush`, padding **24**; scroll trong page |
| Tokens | Mở rộng `ThemeResources.xaml` + `ControlStyles.xaml` — **cấm** hex inline trong Views (trừ ResourceDictionary) |
| Components | `PageHeader`, `StatusBadge`, `TablePaginationBar`, style `CardBorder`, `AdminDataGridStyle`, `FilterToolbar` |
| DataGrid | `GridLinesVisibility=None`, header uppercase nhỏ, row 48–52px, badge cột trạng thái |
| DataGrid selection (D-UI.9) | Row selected/hover — **`NeutralBgBrush`** / **`SurfacePageBrush`**; **cấm** highlight xanh system; chữ cột dữ liệu **`DataGridCellTextBrush`** (#000) · **`FontWeight=Normal`** (parity cột STT; **cấm** SemiBold cột MÃ/Tên/…) · **cột THAO TÁC** giữ màu nút hiện tại · badge/trạng thái semantic giữ token · `SelectionUnit=FullRow` |
| Icon nav | Segoe MDL2 Assets — map trong `ShellNavIcons` theo `navId` |
| Phạm vi D-UI.1 | Shell v2 + styles + polish **Tổng quan** + **Chi tiết đơn vị** Admin |
| Phạm vi D-UI.2 | Polish màn **Đăng nhập** (§2.9) |

#### 2.7.1 Nút Tìm kiếm & Làm mới — primary light (D-UI.14)

Parity pagination active / sidebar active — **cấm** navy đặc cho Tìm kiếm & Làm mới.

| Mục | Quy tắc |
|-----|---------|
| Style | **`PrimaryLightButtonStyle`** — nền `PrimaryLightBrush` · chữ `PrimaryBrush` · viền `PrimaryLightBorderBrush` |
| Toolbar filter | **`FilterToolbarPrimaryButtonStyle`** BasedOn `PrimaryLightButtonStyle` — **Tìm kiếm** + **Làm mới** |
| Page header Làm mới | **`PrimaryLightButtonStyle`** + icon spin `IsRefreshing` |
| Xóa lọc | Giữ **`FilterToolbarSecondaryButtonStyle`** |
| Ngoại lệ navy | **Xác nhận yêu cầu mở khóa** (Chi tiết đơn vị) → **`FilterToolbarNavyButtonStyle`** |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.14a | SPEC §2.7.1 | [x] |
| D-UI.14b | `PrimaryLightButtonStyle` + `FilterToolbarPrimaryButtonStyle` | [x] |
| D-UI.14c | Rollout header/filter Làm mới + Tìm kiếm | [x] |

#### 2.7.1.1 Làm mới — dừng spin + overlay giữa trang (D-UI.28)

Mọi màn có **Làm mới** / bộ lọc list (ADMIN + HEAD). **Cấm** overlay trên Login / Đổi MK / Cài đặt hệ thống.

| Mục | Quy tắc |
|-----|---------|
| Reload | **Làm mới** = gọi lại API (giữ bộ lọc đã apply) — **cấm** chỉ lọc client |
| Icon nút | Control **`RefreshSpinIcon`** — `IsSpinning={Binding IsRefreshing}` · **bắt buộc** `Stop()` + `Angle=0` khi `false` — **cấm** `BeginStoryboard RepeatForever` không `StopStoryboard` (WPF kẹt xoay) |
| Overlay | **`PageBusyOverlay`** last child root `Grid` · `RowSpan` phủ trang · `ZIndex` cao |
| Bảng khi refresh | **Giữ** DataGrid hiện (không collapse) — **cả** khi 0 dòng |
| Lần tải đầu | `IsLoading` **chỉ** khi chưa từng hiện bảng → spinner giữa trang; có thể giữ text «Đang tải…» trong card |
| Tìm kiếm / Xóa lọc / Làm mới / đổi trang | **chỉ** `IsRefreshing` — **cấm** `IsLoading` dù danh sách đang 0 dòng (header DataGrid **cấm** ẩn/nhấp nháy) |
| Phân quyền · Đăng ký VT | Cùng `RefreshSpinIcon` + overlay |

##### Delay + vòng tròn giữa trang — không giật màn (D-UI.29)

Làm mới nhanh **không** được flash overlay (giật / lag composite WPF).

| Mục | Quy tắc |
|-----|---------|
| Feedback ngay | Icon nút `RefreshSpinIcon` xoay **ngay** khi `IsRefreshing` |
| Overlay khi refresh | **Tìm kiếm** hiện **ngay** (`IsRefreshing`, delay **0ms** — D-UI.48). **Làm mới** cùng overlay 0ms (không giấu tiến trình nhanh/chậm) |
| Overlay lần tải đầu | `IsLoading` (trang trống): hiện sau **120ms** |
| Hình | Card nhỏ giữa trang: **vòng tròn** indeterminate + `ShellUiStrings.PageBusyMessage` |
| Cấm | Full-page `Opacity` phủ DataGrid (mỗi frame vẽ lại cả bảng → giật màn) |
| Hit-test | Overlay **không** block click |
| Ẩn | `IsLoading`/`IsRefreshing` = `false` → ẩn **ngay**, `Stop()` animation |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.28a | SPEC §2.7.1.1 | [x] |
| D-UI.28b | `RefreshSpinIcon` + `PageBusyOverlay` | [x] |
| D-UI.28c | Rollout mọi màn Làm mới (gồm HEAD Chấm công) | [x] |
| D-UI.29a | SPEC delay + vòng tròn giữa trang | [x] |
| D-UI.29b | `PageBusyOverlay` delay 400ms / không dim DataGrid | [x] |
| D-UI.32 | Tìm kiếm / Làm mới — **cấm** ẩn header DataGrid (0 dòng ≠ lần tải đầu) | [x] |

#### 2.7.2 Toast shell sau ghi dữ liệu (D-UI.17)

Parity Web `FlashBanner` / D-ATT.2 `ToastHost`. **Một** kênh: `App.Toasts` overlay `MainShellWindow`.

| Mục | Quy tắc |
|-----|---------|
| Khi nào | Sau API **tạo / sửa / xóa / chấm / khóa / import** — dialog đã đóng (hoặc thao tác trên page) |
| Tone | **Success** API OK · **Warning** skip / import một phần / file trống / nhắc 0 HEAD · **Danger** API fail trên **page** |
| Format | Icon `E73E` / `E7BA` / `E783` · token Success/Warning/Danger · 4500ms · nút ✕ |
| Cấm | `StatusMessage` xanh/đỏ **dính trên page** sau mutation |
| Không toast | Validate **trong dialog/form** · `MessageBox` **xác nhận** trước xóa · lỗi **tải/filter** (giữ `ErrorMessage` trên page) · banner live **Đăng ký vân tay** · Excel **mở file** (`ExcelSaveHelper`) |
| Fail khi dialog còn mở | Banner **trong dialog** — **không** toast (bị che) |
| Skip range | `ManualAttendanceRangeResult.SkipCount > 0` → Warning (HEAD/Admin lịch thủ công, cùng wizard D-ATT.2) |
| Import Excel | Đủ dòng Success · một phần / file trống Warning · map/create fail Danger |
| Token kiosk | Copy / phát hành / PIN / nhãn / xoay / thu hồi → Success; **cấm** gán `RotateTitle`/`RevokeTitle` làm message |

#### 2.7.2.1 Câu toast ngắn — thành công / thất bại / cảnh báo (D-UI.18)

Mẫu bắt buộc. Helper `ToastCopy` (`BV87.Core.Helpers`). **Cấm** dump `ex.Message` dài trên thao tác 1 NV; **cấm** «Đã cập nhật N ngày» không tên / không status.

| Tone | Công thức | Ví dụ |
|------|-----------|--------|
| Success (có đối tượng) | `Đã {động từ} thành công {nội dung} cho {đối tượng}.` | `Đã gán thành công Thai sản 1 ngày cho nhân viên A.` |
| Success (CRUD mục) | `Đã {động từ} thành công {loại} {tên}.` | `Đã thêm thành công cấp bậc Thiếu tá.` |
| Danger | `Đã {động từ} thất bại {nội dung} cho {đối tượng}.` | `Đã gán thất bại Thai sản cho nhân viên A.` |
| Warning | `Cảnh báo: đã {động từ} {nội dung} cho {đối tượng}; {lý do}.` | `Cảnh báo: đã gán Thai sản 3 ngày cho nhân viên A; bỏ qua 2 ngày đã quét vân tay.` |

| Đối tượng | Prefix |
|-----------|--------|
| Nhân viên | `nhân viên {Tên}` |
| Đơn vị | `đơn vị {Tên}` |
| Tài khoản | `tài khoản {username}` |
| Kiosk | `kiosk {nhãn}` |

| Phạm vi | Copy |
|---------|------|
| Lịch thủ công | gán + `statusLabel` + `N ngày` — **không** dùng `result.Message` BE |
| Nghỉ trực | chấm + nhãn loại (1 ngày / nửa buổi chiều) |
| Về sớm / điền giờ / duyệt giờ / clear | lưu / điền / duyệt / đưa về chưa chấm + tên NV |
| Tổng quan khóa/nhắc | khóa\|mở khóa sổ · gửi nhắc nhở N đơn vị |
| Chi tiết khóa ngày | mở khóa\|thu hồi mở khóa + ngày + đơn vị |
| Catalog / Excel | CRUD + tên; import `N {unitLabel}` |
| Token / MK / hệ thống | phát hành token cho kiosk · đổi mật khẩu · lưu cấu hình |

WPF **không** ưu tiên `ManualAttendanceRangeResult.Message` (câu BE không có tên NV).

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.18a | SPEC §2.7.2.1 | [x] |
| D-UI.18b | `ToastCopy` + range / nghỉ trực / HEAD+Admin chấm | [x] |
| D-UI.18c | Tổng quan · unlock · vân tay | [x] |
| D-UI.18d | Catalog · Excel · cài đặt | [x] |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.17a | SPEC §2.7.2 + `ShellToast` | [x] |
| D-UI.17b | HEAD/Admin Chấm công + Tổng quan | [x] |
| D-UI.17c | Catalog + Excel import | [x] |
| D-UI.17d | Cài đặt / Token / MK / Unlock / HEAD NV | [x] |

#### 2.7.3 HEAD Thống kê / Nhân viên — chữ cột Normal (D-UI.19)

Parity D-UI.9 + catalog `AdminDataGridTextCellStyle`. **Cấm** `FontWeight=SemiBold` trên cột dữ liệu (họ tên, MSNV / MÃ NV, ngày, trạng thái text).

| Màn | Rule |
|-----|------|
| Thống kê (`HeadStatisticsPage`) | Cột NHÂN VIÊN: **chỉ họ tên** `AdminDataGridTextCellStyle` (Normal) — **cấm** dòng MSNV dưới tên; NGÀY / TRẠNG THÁI / GHI CHÚ cùng style |
| Nhân viên (`HeadStaffFingerprintPage`) | Cột MÃ NV + HỌ TÊN: `AdminDataGridTextCellStyle` — **không** override SemiBold |
| Ngoại lệ | Badge/chip (vân tay, StatusBadge) giữ token SemiBold/Bold |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.19a | SPEC §2.7.3 | [x] |
| D-UI.19b | `HeadStatisticsPage` + `HeadStaffFingerprintPage` | [x] |

#### 2.7.4 Title bar chương trình (D-UI.20)

`MainShellWindow` + `LoginWindow`: **`BVQY87 - Chương trình chấm công`**. Không tách theo role. Mode Agent kiosk giữ `AgentUiStrings.WindowTitle`.

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.20a | SPEC §2.6 / §2.7.4 | [x] |
| D-UI.20b | `ShellUiStrings.WindowTitle` + shell/login | [x] |

#### 2.7.5 Tooltip ô chữ DataGrid (D-UI.30)

Mọi bảng `AdminDataGridStyle` (ADMIN + HEAD + dialog).

| Mục | Quy tắc |
|-----|---------|
| Cơ chế | `AdminDataGridTextCellStyle.ToolTip` = `{Binding Text, RelativeSource=Self}` — **cấm** bind từng property cột |
| Trim | Giữ `TextTrimming=CharacterEllipsis` trên cell chữ |
| Ô trống | Tooltip **tắt** khi `Text` rỗng hoặc `—` |
| STT | `DataGridSttCellStyle` **cấm** tooltip |
| THAO TÁC | Không tooltip nội dung (nút/menu) |
| Template / badge | `StatusBadge` tooltip = `Label` · TextBlock template (trạng thái, ngón, ghi chú) `ToolTip` = full text |
| Token kiosk | Giữ tooltip token/PIN riêng (đã có) |
| Cột chưa `ElementStyle` | Bắt buộc `BasedOn AdminDataGridTextCellStyle` (trim + tooltip) |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.30a | SPEC §2.7.5 | [x] |
| D-UI.30b | `AdminDataGridTextCellStyle` + STT null + StatusBadge | [x] |
| D-UI.30c | Rollout ElementStyle / template tooltip các bảng | [x] |

#### 2.7.6 DatePicker — định dạng `dd/MM/yyyy` (D-UI.31)

Mọi `DatePicker` WPF (filter, pill ngày, wizard nghỉ trực, lịch thủ công, dialog gán khoảng ngày, Agent nếu có). **Cấm** phụ thuộc ShortDate Windows (`MM/dd/yyyy`).

| Mục | Quy tắc |
|-----|---------|
| Hiển thị / gõ | **`dd/MM/yyyy`** · `SelectedDateFormat=Short` |
| Culture | `vi-VN` — `AppUiCulture.Apply()` lúc `OnStartup` (trước mọi cửa sổ) + `FrameworkElement.Language` |
| Style | `FilterDatePickerStyle` (+ implicit `TargetType=DatePicker`) — **cấm** DatePicker trần không kế thừa style này |
| API | Vẫn ISO `yyyy-MM-dd` (`ToApiDate`) — **cấm** đổi contract |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.31a | SPEC §2.7.6 | [x] |
| D-UI.31b | `AppUiCulture` + `FilterDatePickerStyle` + implicit DatePicker | [x] |

#### 2.7.7 Page title IN HOA (D-UI.40)

Mọi H1 màn WPF (`PageHeader.Title` / `PageTitleStyle`). **Cấm** đổi wording — chỉ hoa/thường. **Cấm** `ToUpper` lúc bind, converter, `Typography.Capitals`. Literal IN HOA trong constants.

| In scope | Out of scope |
|----------|----------------|
| `*UiStrings.*.PageTitle` · `AdminUiStrings.DeptDetailTitle` · `AdminUiStrings.OverviewPageTitle` | Title bar cửa sổ (D-UI.20) · dialog / MessageBox (D-UI.34) · sidebar nav · subtitle · nút · toast · tiêu đề mục đã IN HOA (`DANH SÁCH NHÂN VIÊN`, `CHI TIẾT`, header cột) |

| Màn | Constant | Copy |
|-----|----------|------|
| HEAD Chấm công | `HeadUiStrings.Attendance.PageTitle` | `CHẤM CÔNG HẰNG NGÀY` |
| HEAD Thống kê | `HeadUiStrings.Statistics.PageTitle` | `THỐNG KÊ LỊCH SỬ CHẤM CÔNG` |
| HEAD Nhân viên | `HeadUiStrings.Staff.PageTitle` | `NHÂN VIÊN` |
| Admin Tổng quan | `AdminUiStrings.OverviewPageTitle` | `TỔNG QUAN CHUNG` |
| Admin Chi tiết | `AdminUiStrings.DeptDetailTitle` | `CHI TIẾT ĐƠN VỊ` |
| Cấp bậc | `CatalogUiStrings.Ranks.PageTitle` | `DANH MỤC CẤP BẬC` |
| Chức vụ | `CatalogUiStrings.Positions.PageTitle` | `DANH MỤC CHỨC VỤ` |
| Trạng thái | `CatalogUiStrings.StatusCatalog.PageTitle` | `TRẠNG THÁI CHẤM CÔNG` |
| Đơn vị | `CatalogUiStrings.Departments.PageTitle` | `DANH MỤC ĐƠN VỊ` |
| Nhân viên ADMIN | `CatalogUiStrings.Staff.PageTitle` | `DANH MỤC NHÂN VIÊN` |
| Yêu cầu mở khóa | `UtilitiesUiStrings.UnlockRequests.PageTitle` | `YÊU CẦU MỞ KHÓA` |
| Lịch sử nhắc | `UtilitiesUiStrings.ReminderHistory.PageTitle` | `LỊCH SỬ GỬI NHẮC NHỞ` |
| Nhật ký | `UtilitiesUiStrings.AuditLog.PageTitle` | `NHẬT KÝ CHỈNH SỬA` |
| Lịch sử vân tay | `UtilitiesUiStrings.FingerprintHistory.PageTitle` | `LỊCH SỬ VÂN TAY` |
| Đăng ký vân tay | `UtilitiesUiStrings.FingerprintEnroll.PageTitle` | `ĐĂNG KÝ VÂN TAY` |
| Đổi mật khẩu | `SettingsUiStrings.ChangePassword.PageTitle` | `ĐỔI MẬT KHẨU` |
| Phân quyền | `SettingsUiStrings.Accounts.PageTitle` | `PHÂN QUYỀN` |
| Cài đặt hệ thống | `SettingsUiStrings.System.PageTitle` | `CÀI ĐẶT HỆ THỐNG` |
| Token kiosk | `SettingsUiStrings.KioskTokens.PageTitle` | `QUẢN LÝ TOKEN VÂN TAY` |

Tổng quan: **cấm** hardcode `Title=` trên XAML — bind `OverviewPageTitle`. Nav `ShellNavigation` giữ sentence case. Web constants **ngoài** ticket này.

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.40a | SPEC §2.7.7 | [x] |
| D-UI.40b | Constants `PageTitle` + Tổng quan bind `OverviewPageTitle` | [x] |

#### 2.7.8 Toolbar compact — filter liền kề + Excel header (D-UI.41)

Chỉ layout XAML / copy placeholder. **Cấm** đổi API, command mới (trừ bind command **đã có**), công thức đếm.

| Màn | Rule |
|-----|------|
| HEAD Thống kê | **Cấm** `PageSubtitle` · **Xuất Excel** ra khỏi `PageHeader.ActionsContent` → **phải** cùng hàng filter (sau Làm mới; cột `*` **chỉ** đẩy Excel, **không** đẩy Tìm kiếm/Xóa/Làm mới) · panel lỗi **Collapsed** khi trống (parity D-UI.38) |
| Admin Tổng quan | Filter: **Lọc đơn vị** · Combo · **Tìm kiếm** · **Xóa lọc** · **Làm mới** **liền kề** Combo — **cấm** cột `*` giữa Combo và nút · **Làm mới** **không** trên `PageHeader` (giữ **Gửi nhắc nhở**) |
| Admin Chi tiết | Hàng 1: … **Tìm kiếm** · **Xóa lọc** (`ResetFilterCommand` đã có) · **Làm mới** — bind nút còn thiếu §2.11.5 |
| Catalog 5 màn | **Làm mới** sau **Xóa lọc** trên filter card (`FilterToolbarPrimaryButtonStyle`) · **cấm** Làm mới trên `PageHeader` · `ExcelTaskMenu` **ngay sau** nút Thêm (Đơn vị: sau **Thêm đơn vị**; Cấp bậc/Chức vụ/Trạng thái/NV: sau **Thêm …**) · TextBox tìm: `Tag` = `SearchPlaceholder` (watermark `FilterTextBoxStyle`) |

Watermark: `FilterTextBoxStyle` hiện `Tag` khi `Text` rỗng · `ContentMutedBrush` · **cấm** control/watermark mới · ô không set `Tag` (form/settings) không hiện chữ.

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.41a | SPEC §2.7.8 | [x] |
| D-UI.41b | HEAD Thống kê — bỏ subtitle, Excel trên filter, collapse lỗi | [x] |
| D-UI.41c | Tổng quan + Chi tiết filter | [x] |
| D-UI.41d | Catalog 5 màn — Refresh filter, Excel header, placeholder | [x] |

#### 2.7.9 Catalog stat label + Phân quyền (D-UI.42)

Chỉ typography / width / vị trí nút. **Cấm** đổi API.

| Mục | Quy tắc |
|-----|---------|
| `CatalogStatGrid` nhãn | `FontSizeStatLabel` **20** (`ThemeResources`) — 5 màn danh mục hành chính + Phân quyền (cùng control) · giá trị giữ `FontSizeXl` · **cấm** hardcode px |
| Phân quyền cột Username | Width **180** |
| Phân quyền Làm mới | Sau **Xóa lọc** trên filter (`FilterToolbarPrimaryButtonStyle`) · **cấm** trên `PageHeader` |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.42a | SPEC §2.7.9 / §2.14.1 / §2.19.2 | [x] |
| D-UI.42b | `CatalogStatGrid` + `PermissionsPage` | [x] |

#### 2.7.10 Admin bỏ PageSubtitle + placeholder filter + chuông (D-UI.43)

Chỉ layout / copy. **Cấm** đổi API thông báo.

| Mục | Quy tắc |
|-----|---------|
| ADMIN `PageHeader.Subtitle` | **Cấm** trên mọi màn ADMIN (Tổng quan · Chi tiết · tiện ích · cài đặt · enroll) — supersede D-UI.37 «ADMIN vẫn có subtitle» enroll |
| Chi tiết đơn vị tiến độ | D-UI.43 đặt `ActionsContent` — **superseded D-UI.45**: `PageHeader.Subtitle` dưới title |
| Filter TextBox | Mọi ô tìm **text** (ADMIN + HEAD) `Tag` = placeholder mô tả trường (`SearchPlaceholder` / `DeptDetailSearchPlaceholder` / enroll / accounts) — watermark `FilterTextBoxStyle` |
| Chuông (HEAD + ADMIN) | Icon **24** · nút `Min 44` · badge **20** · title item `FontSizeBase` · **body `FontSizeMd`** (was `FontSizeSm`) · header panel `FontSizeBase` |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.43a | SPEC §2.7.10 / §2.20.5 | [x] |
| D-UI.43b | Gỡ `Subtitle=` ADMIN + Chi tiết ActionsContent | [x] |
| D-UI.43c | Placeholder ô tìm còn thiếu + `NotificationBell` | [x] |

#### 2.7.11 Chi tiết đơn vị — tiến độ dưới title (D-UI.45)

Ngoại lệ D-UI.43 **chỉ** màn `AdminDeptAttendanceDetailPage`. **Cấm** đổi công thức số D-UI.39.

| Mục | Quy tắc |
|-----|---------|
| Vị trí | `Đã chấm {marked}/{total} ({pct}%) · toàn đơn vị · Ngày {dd/MM/yyyy}` = `PageHeader.Subtitle` **ngay dưới** `CHI TIẾT ĐƠN VỊ` |
| Cấm | Đặt tiến độ trong `ActionsContent` (phải header) |
| ADMIN khác | Vẫn **cấm** `PageHeader.Subtitle` (D-UI.43) |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.45a | SPEC §2.7.11 / §2.11.2 | [x] |
| D-UI.45b | `Subtitle={Binding PageSubtitle}`; bỏ ActionsContent tiến độ | [x] |

#### 2.7.12 Admin polish bảng / filter (D-UI.46)

Chỉ layout. **Cấm** đổi API / công thức.

| Màn | Quy tắc |
|-----|---------|
| Yêu cầu mở khóa | Cột **NGÀY CHẤM CÔNG** Width **210** (was 175). **THAO TÁC** = nút «Thao tác» → `ContextMenu` **Xác nhận** · **Từ chối** (Từ chối `DangerFgBrush`) — parity §2.19.2.1 · width **120** · enable khi `IsPending` · **cấm** 2 nút ngang |
| Lịch sử vân tay | **Cấm** dòng in-card «CHI TIẾT» (`ListTitle`). Cột **STT** trước **THỜI GIAN** — `PaginationRowNumberHelper` đã có |
| Đăng ký vân tay | Nút **Xóa lọc** (`ClearFilter`) **sau Tìm kiếm** · trước **Làm mới** — reset ô tìm · combo đơn vị Tất cả · trạng thái Tất cả → `SearchStaffAsync` |
| Phân quyền | **HỌ VÀ TÊN** Width **160** (was `*`). Cột sau họ tên (**VAI TRÒ** · **ĐƠN VỊ** · **TRẠNG THÁI** · **THAO TÁC**) mỗi cột `Width="*"` MinWidth **120** — chia đều phần còn lại |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.46a | SPEC §2.7.12 / §2.17.1 / §2.17.5 / §2.17.7 / §2.19.2 | [x] |
| D-UI.46b | Unlock + Fingerprint history + Enroll + Permissions | [x] |

#### 2.7.13 Đăng ký vân tay — ô tìm + hint preview (D-UI.47)

Chỉ layout `FingerprintEnrollPage` (ADMIN + HEAD cùng view). **Cấm** đổi copy / API / luồng quét.

| Mục | Quy tắc |
|-----|---------|
| Ô tìm Họ tên / Mã NV | Width **360** (was 220) — đủ hiện **full** watermark `SearchPlaceholder` «Tìm theo họ tên, mã nhân viên...» · **cấm** cắt placeholder · **cấm** đổi width Combo đơn vị / trạng thái |
| Hint khung quét | `PreviewWaiting` «Chờ đặt ngón tay…» khi `PreviewImage` null — **`FontSizeXl`** + **SemiBold** + `ContentMutedBrush` (was inherit `FontSizeBase`) · **cấm** hardcode FontSize |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.47a | SPEC §2.7.13 / §2.17.7 | [x] |
| D-UI.47b | `FingerprintEnrollPage` — TextBox 360 + PreviewWaiting `FontSizeXl` | [x] |

#### 2.7.14 Bộ lọc — chỉ chạy khi bấm Tìm kiếm (D-UI.48)

Mọi màn **list có bộ lọc** (ADMIN + HEAD). **Cấm** invent màn/API mới. **Cấm** overlay trên Login / Đổi MK (form tài khoản) / Cài đặt hệ thống / chuông thông báo / Agent kiosk.

| Mục | Quy tắc |
|-----|---------|
| Nút Tìm kiếm | Mọi filter card **bắt buộc** nút **Tìm kiếm** (`FilterToolbarPrimaryButtonStyle` + icon kính) — gồm **Yêu cầu mở khóa** (was chỉ Làm mới) |
| Apply | **Chỉ** Tìm kiếm / Xóa lọc / Làm mới / đổi trang / đổi page-size. ComboBox · DatePicker · ô text = **draft** — **cấm** `LoadAsync` / `ApplyPaging` / `ApplyStaffFilter` trong setter |
| Preset thống kê HEAD | Combo khoảng thời gian **chỉ** điền Từ/Đến draft — **cấm** gọi `ApplyFilter` trong setter |
| Overlay Tìm kiếm | `PageBusyOverlay` hiện **ngay** khi `IsRefreshing` (delay refresh **0ms** — supersede D-UI.29 400ms cho Tìm kiếm). Lần tải đầu vẫn delay **120ms** |
| Lọc client (catalog / kiosk / HEAD NV / HEAD chấm) | Tìm kiếm vẫn set `IsRefreshing` quanh apply — overlay giữa trang |
| Empty | 0 dòng sau tải/lọc · `!IsLoading` · `!IsRefreshing` → overlay giữa card bảng: **`ShellUiStrings.NoSearchResults`** = «Không có dữ liệu tìm kiếm phù hợp.» · **giữ** header DataGrid (D-UI.32) · **cấm** ẩn lưới khi empty |
| Ngoại lệ | Chọn **ngày chấm** (pill HEAD) = điều hướng ngày, không phải filter card |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.48a | SPEC §2.7.14 / §2.17.1 / §2.17.7 / §2.20.2 | [x] |
| D-UI.48b | Gỡ auto-apply dropdown + Unlock Tìm kiếm | [x] |
| D-UI.48c | Overlay Search ngay + empty copy chung | [x] |

#### 2.7.15 Chi tiết đơn vị — ô tìm không label Họ tên (D-UI.49)

Chỉ `AdminDeptAttendanceDetailPage` filter hàng 1. **Cấm** đổi API / thứ tự Trạng thái · Tìm kiếm.

| Mục | Quy tắc |
|-----|---------|
| Label | **Cấm** nhãn «Họ tên» cạnh ô tìm — hint đã mô tả tên + mã NV + chức vụ, label gây hiểu nhầm |
| Ô tìm | `FilterTextBoxStyle` Width **360** (was 220) — full watermark `DeptDetailSearchPlaceholder` «Tìm theo tên, mã NV, chức vụ…» · **cấm** cắt placeholder |
| Thứ tự | **Chọn đơn vị** · **Chọn ngày** · ô tìm · **Trạng thái** · **Tìm kiếm** · **Xóa lọc** · **Làm mới** |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.49a | SPEC §2.7.15 / §2.11.5 | [x] |
| D-UI.49b | `AdminDeptAttendanceDetailPage` — bỏ label, TextBox 360 | [x] |

#### 2.7.16 Danh mục Đơn vị — ô tìm full hint (D-UI.50)

Chỉ `DepartmentCatalogPage` filter. **Cấm** đổi Combo nhóm / thứ tự nút.

| Mục | Quy tắc |
|-----|---------|
| Ô tìm | `FilterTextBoxStyle` Width **440** (was 240) — full watermark `Departments.SearchPlaceholder` «Tìm theo mã, ký hiệu, tên, trưởng đơn vị...» · **cấm** cắt placeholder |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.50a | SPEC §2.7.16 / §2.14 | [x] |
| D-UI.50b | `DepartmentCatalogPage` TextBox 440 | [x] |

#### 2.7.17 Lịch sử nhắc — lọc loại gửi (D-UI.51)

Chỉ `ReminderHistoryPage` filter card. **Cấm** đổi API `GET …/reminder-history?from=&to=`. **Cấm** auto-apply khi đổi Combo (D-UI.48).

| Mục | Quy tắc |
|-----|---------|
| Combo | Label **Loại gửi** · Combo **140** sau khoảng ngày, trước **Tìm kiếm** |
| Option | **Tất cả** (mặc định) · **Tự động** (`AUTO`) · **Thủ công** (`MANUAL` — mọi `triggerType` khác `AUTO`, gồm null) |
| Apply | Draft đến khi **Tìm kiếm** / **Xóa lọc** / **Làm mới** — lọc **client-side** trên `history` cùng đơn vị |
| Xóa lọc | Loại gửi → Tất cả |
| Excel | Toàn bộ **kết quả lọc** (đơn vị + loại), không chỉ trang hiện tại |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.51a | SPEC §2.7.17 / §2.17.2 | [x] |
| D-UI.51b | `ReminderHistoryPage` Combo Loại gửi | [x] |
| D-UI.51c | `ReminderHistoryViewModel` draft/applied + Excel lọc | [x] |

#### 2.7.18 Đăng ký vân tay — cột Họ tên (D-UI.53)

Chỉ `FingerprintEnrollPage` (ADMIN + HEAD cùng view). **Cấm** đổi `Width=*` cho Họ tên. **Cấm** đổi MinWidth cột trạng thái.

| Mục | Quy tắc |
|-----|---------|
| Cột Họ tên | Width **220** (was 160) — đủ tên VN dài hơn trên HEAD; tooltip full text giữ nguyên (D1.1ab) |
| Cột trạng thái | Vẫn `*` MinWidth **220** |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.53a | SPEC §2.7.18 / §2.17.7 | [x] |
| D-UI.53b | `FingerprintEnrollPage` cột Họ tên 220 | [x] |

#### 2.7.19 Cột giờ — `HH:mm AM|PM` (D-UI.54)

Mọi **cột / ô chỉ đọc** hiện giờ trên WPF. **Cấm** đổi payload API / ô nhập (`HH:mm` 24h).

| Mục | Quy tắc |
|-----|---------|
| Clock | `{HH:mm} {AM\|PM}` — `HH` = **00–23** (vd. `07:00 AM`, `13:00 PM`) · **cấm** 12h `01:00 PM` |
| AM / PM | `hour < 12` → `AM` · `hour ≥ 12` → `PM` · `00:00` = AM · `12:00` = PM |
| Punch GIỜ | `FormatPunchTimes` = chỉ `FormatClockDisplay` nối ` · ` (vd. `07:53 AM`) — **cấm** tiền tố `S` / `Tr` / `C` / `R` · HEAD Chấm công + Admin Chi tiết · MinWidth **280** |
| Datetime log | `dd/MM/yyyy HH:mm AM\|PM` (`FormatLogDateTime`) — empty → `—` |
| Ô nhập | Điền giờ / Cài đặt hệ thống / API times — **giữ** `HH:mm` không hậu tố |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.54a | SPEC §2.7.19 / §2.17.0 / §2.20.1 | [x] |
| D-UI.54b | `AttendanceFormatHelper` + `AdminUtilitiesFormatHelper` | [x] |
| D-UI.54c | Cột GIỜ MinWidth 280 · scan / wizard / Excel | [x] |

### 2.9 Màn Đăng nhập — polish (D-UI.2)

| Mục | Quy tắc |
|-----|---------|
| Kích thước cửa sổ | **480×600**; `CenterScreen`; `ResizeMode=NoResize`; card căn giữa dọc; `ScrollViewer` fallback nếu DPI cao |
| Card trung tâm | Rộng **400**; `CardBorderFlatStyle` + padding **28,32,28,36** — **cấm** `DropShadowEffect` (D1.1w / D-UI.52) |
| Logo | `HospitalLogo` vertical, logo **72px**; tên BV `FontSizeStatLabel` navy; phụ đề `FontSizeSm` |
| Input | `FilterTextBoxStyle` / `FilterPasswordBoxStyle`; label `FormLabelStyle` (`FontSizeMd`) — **cấm** hardcode 13 |
| Nút chính | Full-width, cao **44**, `PrimaryButtonStyle`, «Đăng nhập» |
| Lỗi | `DangerFgBrush` trên nền `DangerBgBrush`; viền `DangerFgBrush` — **cấm** hex inline |
| Kiosk | **Cấm** — không link/nút kiosk trên login (D1.1) |
| Tokens | Chỉ dùng `ThemeResources` / `ControlStyles` |

#### 2.9.1 Login — chữ nét (D-UI.52)

Chỉ `LoginWindow`. **Cấm** đổi `AppFontFamily` toàn app. **Cấm** clone chrome Viettel-HIS.

| Mục | Quy tắc |
|-----|---------|
| Window | `UseLayoutRounding=True` · `SnapsToDevicePixels=True` · `TextFormattingMode=Display` · `TextRenderingMode=ClearType` trên root |
| Card | `CardBorderFlatStyle` — **cấm** `DropShadowEffect` (gây nhòe Times New Roman) |
| Typography | Label / input / nút = token `FontSizeMd` / `FontSizeBase` · **cấm** 13/22 hardcode |
| Contrast | Label `ContentHeadingBrush` · title logo `NavyBrush` |
| Cấm | Layout 2 cột HIS · footer Server/DB · nút Thoát · title «ĐĂNG NHẬP HỆ THỐNG» · Segoe UI (phase B ngoài ticket này) |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.52a | SPEC §2.9 / §2.9.1 / D1.1w | [x] |
| D-UI.52b | `LoginWindow` — bỏ shadow, rounding, token font | [x] |

### 2.8 Admin Tổng quan chung — layout & phân trang (D3.1 / A-02 polish)

Màn: `AdminDashboardOverviewPage` · VM: `AdminDashboardViewModel` · Component: `Controls/TablePaginationBar`.

| Mục | Quy tắc |
|-----|---------|
| Shell content | `ContentHost` **fill** chiều cao; **cấm** `ScrollViewer` shell cuộn cả page bảng admin |
| Card «Tiến độ chấm công» | Một card: header · `DataGrid` (scroll dọc nội bộ) · footer phân trang |
| DataGrid | `VerticalScrollBarVisibility=Auto`; parent hàng `*` có `MinHeight=0` |
| Footer phân trang | Footer trong card — **§2.10** (chuẩn toàn app; reference: màn này) |
| Page size mặc định | **20**; options: `10, 20, 50, 100` |
| Đổi page size | Reset trang **1**; slice client-side |

### 2.8.1 Admin Tổng quan — polish bảng & toolbar (D3.1.1 / A-02.2)

Màn: `AdminDashboardOverviewPage` · VM: `AdminDashboardViewModel` · Component: `Controls/TablePaginationBar`.

| Mục | Quy tắc |
|-----|---------|
| Cột **STT** | Thêm **trước** cột **ĐƠN VỊ** trên bảng «Tiến độ chấm công» |
| Header STT | Text `STT`; căn giữa; width token **`DataGridSttColumnWidth`** (**72**) |
| Giá trị STT | Số thứ tự **client-side** trên trang hiện tại: `(CurrentPage - 1) × PageSize + index + 1` |
| Căn header + cell | **Số** (STT · Tiến độ · Tỷ lệ): header + cell **giữa** (`AdminDataGridColumnHeaderCenterStyle`); **chữ** (Đơn vị · Trạng thái · Thao tác): header + cell **trái** |
| Width bảng tiến độ | **STT** 72 · **ĐƠN VỊ** `*` MinWidth 180 MaxWidth 480 · **TIẾN ĐỘ** 100 · **TỶ LỆ** 90 · **TRẠNG THÁI** 130 · **THAO TÁC** 110 — khoảng dư nằm bên phải, không chen giữa cột |
| Phạm vi STT | Tính trên `FilteredDepartments` đã phân trang; đổi trang / page size / lọc → STT cập nhật |
| Footer page size | ComboBox **cùng chiều cao** nút **Trước** / **Sau**; cùng family border/radius (`LineBrush`, corner 8) |
| Chiều cao pagination | **MinHeight 36px** cho Button pagination và ComboBox page size (`PaginationButtonStyle`, `PaginationComboBoxStyle`) |
| Label «Hiển thị» | Căn giữa dọc với ComboBox và nút |
| Toolbar lọc đơn vị | Hàng «Lọc đơn vị» + ComboBox + **Tìm kiếm** + **Xóa lọc** + **Làm mới** **liền kề** Combo — **cấm** cột `*` giữa Combo và nút (D-UI.41) |
| Layout filter | `Grid` 1 hàng hoặc `VerticalAlignment="Center"` trên tất cả control; ComboBox và nút **MinHeight 38px** |
| Phạm vi ticket | STT + filter toolbar — xem §2.8.1; pagination — **§2.10** (chuẩn toàn app) |

### 2.8.2 Admin Tổng quan — banner dung lượng máy chủ (D-DISK.1)

Chỉ **ADMIN** · màn `AdminDashboardOverviewPage`. **Không** hiện khi ổ còn trống đủ.

| Mục | Quy tắc |
|-----|---------|
| Nguồn | Host Windows ghi `backup/disk-status.json` (script `write-disk-status.ps1`, mỗi **1 giờ** + sau dump 22:00) |
| API | `GET /api/admin/system/storage` — ADMIN JWT · HEAD **403** |
| Đo đĩa | **Cấm** `FileStore` trong container Docker (ổ ảo WSL). Chỉ đọc JSON host |
| Ẩn banner | `level=ok` · file thiếu · JSON lỗi · API lỗi — **cấm** báo giả |
| Cảnh báo | `freePercent` **&lt; 20%** (đã dùng &gt; 80%) → tone **Warning** |
| Nguy hiểm | `freePercent` **&lt; 10%** (đã dùng &gt; 90%) → tone **Danger** |
| Vị trí | Dưới `PageHeader`, trên KPI — **cấm** hiện HEAD |
| Copy | Message VN từ API (`message`) — GB 1 chữ số thập phân |
| Docker | Bind-mount `../backup:/app/backup:ro` · `DISK_STATUS_PATH=/app/backup/disk-status.json` |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-DISK.1a | SPEC §2.8.2 + API | [x] |
| D-DISK.1b | JSON host + Task 1 giờ + volume Docker | [x] |
| D-DISK.1c | WPF banner Tổng quan (ẩn khi ok) | [x] |

### 2.10 TablePaginationBar — chuẩn phân trang danh sách (D-UI.3+)

**Reference implementation:** màn **Admin Tổng quan chung** (`AdminDashboardOverviewPage`).

Component: `Controls/TablePaginationBar` · Helper: `Helpers/PaginationPageRange`.

**Phạm vi:** Mọi màn WPF desktop có **bảng / danh sách kết quả phân trang** (Admin, HEAD, Kiosk nếu có list) **bắt buộc** dùng component này — **cấm** footer tùy biến chỉ «Trước» / «Sau» hoặc summary «Trang n/n».

| Mục | Quy tắc |
|-----|---------|
| Layout footer | **Một hàng căn phải** (`HorizontalAlignment="Right"`); thứ tự: **Tổng số** · **điều hướng** · **page size** |
| Summary | **`Tổng số {TotalItems:N0} {UnitLabel}`** — VD: `Tổng số 34 đơn vị`; **cấm** «Hiển thị 1–20 của 34» / «Trang n/n - n …» |
| UnitLabel | DP `UnitLabel` — theo bảng §2.10.1 |
| Điều hướng | **Đầu** (`«`) · **Trước** (`‹`) · **dãy số trang** · **Sau** (`›`) · **Cuối** (`»`) |
| Dãy số trang | `TotalPages ≤ 7`: hiện đủ; **`TotalPages > 7`**: ellipsis `…` (`PaginationPageRange`) |
| Trang active | Nền **`PrimaryBrush`**, chữ trắng; inactive: viền `LineBrush`, hover `NeutralBgBrush` |
| Kích thước nav | Nút vuông **36×36px** (`MinHeight` **36**); ComboBox page size **cùng chiều cao** (`PaginationNavButtonStyle`, `PaginationComboBoxStyle`) |
| Typography footer | Summary · «Hiển thị» · ellipsis · số trang · ComboBox — token **`FontSizeMd` (16)**; **cấm** hardcode 12/13 |
| Page size | Label **«Hiển thị»** + ComboBox; options **`10, 20, 50, 100`**; default **`20`**; đổi page size → reset trang **1** |
| Vị trí trong page | Footer **trong cùng card** với `DataGrid` — border-top `LineBrush`; **cấm** footer tách card hoặc nằm ngoài vùng bảng |
| Card + bảng | Pattern: tiêu đề section · `DataGrid` (`VerticalScrollBarVisibility=Auto`, hàng `*` `MinHeight=0`) · `TablePaginationBar` |
| Hiển thị bar | **Luôn hiện** sau lần load đầu — kể cả `TotalItems == 0` (summary «Tổng số 0 …», trang 1, nav disabled) · **cấm** `Collapsed` khi rỗng |
| API component | DPs: `CurrentPage`, `TotalPages`, `TotalItems`, `PageSize`, `PageSizeOptions`, `UnitLabel`, `GoToPageCommand` |
| Styles | Chỉ dùng styles trong `ControlStyles.xaml` — **cấm** duplicate pagination UI inline trong Views |

#### 2.10.1 Ma trận màn hình & `UnitLabel`

| Màn / ticket | View | `UnitLabel` | Trạng thái rollout |
|--------------|------|-------------|-------------------|
| A-02 Tổng quan chung | `AdminDashboardOverviewPage` | `đơn vị` | [x] **Chuẩn** (reference) |
| A-03 Chi tiết đơn vị | `AdminDeptAttendanceDetailPage` | `nhân viên` | [x] D-UI.7 / A-03.2 |
| H-02 Chấm công HEAD | `HeadAttendancePage` | `nhân viên` | [x] Migrate (D6.1) |
| H-05 Thống kê HEAD | `HeadStatisticsPage` | `kết quả` | [x] D6.2 |
| H-06 Nhân viên HEAD | `HeadStaffFingerprintPage` | `nhân viên` | [x] D6.3 |
| A-04.1 Cấp bậc | `StaffAttributeCatalogPage` (Rank) | `cấp bậc` | [x] D4.1 |
| A-04.2 Chức vụ | `StaffAttributeCatalogPage` (Position) | `chức vụ` | [x] D4.1 |
| A-04.3 Trạng thái chấm công | `AttendanceStatusCatalogPage` | `trạng thái` | [x] D4.2 |
| A-04.4 Đơn vị | `DepartmentCatalogPage` | `đơn vị` | [x] D4.3 |
| A-04.5 Nhân viên | `StaffCatalogPage` | `nhân viên` | [x] D4.4 |
| A-05.1 Yêu cầu mở khóa | `UnlockRequestsPage` | `yêu cầu` | [x] A-05.1 |
| A-05.2 Lịch sử nhắc nhở | `ReminderHistoryPage` | `lần nhắc` | [ ] A-05.2 |
| A-05.3 Nhật ký chỉnh sửa | `AttendanceAuditLogPage` | `thao tác` | [ ] A-05.3 |
| D1.1y Đăng ký vân tay | `FingerprintEnrollPage` | `nhân viên` | [x] D1.1y |
| D-ATT.4 Lịch thủ công | `ManualScheduleDialog` | `khoảng` | [x] D-ATT.4 |
| A-08+ / màn list mới | *(bất kỳ)* | Khai báo trong ticket | [ ] Bắt buộc khi implement |

**Cấm:** Màn mới hoặc refactor bảng mà không dùng `TablePaginationBar` khi có phân trang client-side.

#### 2.10.2 Hợp đồng ViewModel (bắt buộc)

Mọi ViewModel gắn `TablePaginationBar` phải expose:

| Property / command | Quy tắc |
|--------------------|---------|
| `CurrentPage` | 1-based; notify khi đổi trang |
| `TotalPages` | `Max(1, Ceil(TotalItems / PageSize))` |
| `TotalItems` | Số dòng **sau filter**, trước slice trang |
| `PageSize` | TwoWay; default **20**; setter reset `_currentPage = 1` |
| `PageSizeOptions` | `[10, 20, 50, 100]` (shared constant) |
| `GoToPageCommand` | `RelayCommand<int>` — clamp `1…TotalPages`, gọi slice client-side |
| `ShowPagination` | **Luôn `true`** (bar luôn hiện; **cấm** ẩn khi `TotalItems == 0`) |

**Slice client-side:** `filtered.Skip((CurrentPage - 1) * PageSize).Take(PageSize)`.

**STT (bắt buộc):** Mọi bảng danh sách phân trang — §2.21.1; `PaginationRowNumberHelper` + `RowNumber` trên row VM.

**Phân trang server-side (hiếm):** Chỉ khi API trả `totalPages` / `page` — vẫn dùng `TablePaginationBar`; map `TotalItems` từ API; ghi rõ trong ticket màn đó.

#### 2.10.3 Snippet bind XAML (reference)

```xml
<controls:TablePaginationBar Grid.Row="2"
    CurrentPage="{Binding CurrentPage}"
    TotalPages="{Binding TotalPages}"
    TotalItems="{Binding TotalItems}"
    PageSize="{Binding PageSize, Mode=TwoWay}"
    PageSizeOptions="{Binding PageSizeOptions}"
    UnitLabel="đơn vị"
    GoToPageCommand="{Binding GoToPageCommand}"/>
```

### 2.11 Admin Tổng quan — mockup KPI & filter (D-UI.5 / A-02.4)

Reference: mockup MediAdmin Dashboard · Màn: `AdminDashboardOverviewPage` · Component: `Controls/DashboardKpiBar`.

| Vùng | Quy tắc |
|------|---------|
| Shell header | Brand cố định **«BV87 — Quản trị»** trái — **cấm** đổi theo nav; phải: **`NotificationBell`** (§2.20.5) · separator · avatar · `RoleLabel` · logout icon |
| PageHeader (D-UI.40 / D-UI.43) | Title `TỔNG QUAN CHUNG` (`AdminUiStrings.OverviewPageTitle`) — IN HOA · **cấm** `PageSubtitle` · §2.7.7 / §2.7.10 |
| Page actions | **Gửi nhắc nhở** = `SecondaryButtonStyle` + icon Send trên `PageHeader` · **Làm mới** trên filter card (D-UI.41) — **cấm** Làm mới trên header |
| KPI card | Component **`DashboardKpiBar`**: trái số **40px** Navy + «Tổng quân số» + bullet Phạm vi (muted) + bullet Chưa chấm (danger) |
| KPI pills phải | `WrapPanel` căn phải; `Count == 0` → `KpiChipNeutralStyle`; **`Count > 0`** → `KpiChipActiveStyle` (info highlight) |
| Filter card | Label **SemiBold** + ComboBox **trái** + **Tìm kiếm** + **Xóa lọc** + **Làm mới** **liền kề** Combo (D-UI.41) — **cấm** cột `*` đẩy nút phải · **cấm** Làm mới trên `PageHeader` |
| Styles mới | `PrimaryLightButtonStyle`, `NavyButtonStyle`, `KpiChipNeutralStyle`, `KpiChipActiveStyle` trong `ThemeResources` / `ControlStyles` |
| Parity Web | Tham chiếu logic màu `DashboardKpiBar.jsx`; layout desktop **ưu tiên mockup pill**, không gộp filter vào page toolbar |

#### 2.11.1 Tổng quan — polish cột bảng & KPI pills (D-UI.6)

Màn: `AdminDashboardOverviewPage` · Component: `Controls/DashboardKpiBar` · Bảng «Tiến độ chấm công».

| Mục | Quy tắc |
|-----|---------|
| Cột **TIẾN ĐỘ** | `Width=120` (tăng từ 100) — đủ hiển thị «x/y» không cắt |
| Cột **TRẠNG THÁI** | `Width=155` (tăng từ 130) — badge «HOÀN THÀNH» / «CHƯA HOÀN THÀNH» không tràn |
| Cột **THAO TÁC** | `Width=130` (tăng từ 110) — nút «Quản lý» thoáng hơn |
| Badge trạng thái (grid) | `FontSize` = token `FontSizeSm` (14) — thay hardcode 11 |
| KPI pills (`DashboardKpiBar`) | Text pill «LABEL : N» — `FontSize` = token **`FontSizeMd` (16)**; padding pill giữ `12,6` |
| KPI nhãn trái | «Tổng quân số» · Phạm vi · Chưa chấm — **cùng `FontSizeMd`** với pill Đi làm / Đi trễ — **cấm** hardcode 13/16 |
| Phạm vi | **Chỉ** màn Tổng quan chung — **không** đổi `AdminDeptAttendanceDetailPage` trong ticket này |

#### 2.11.2 Admin Chi tiết đơn vị — layout & scroll (D-UI.7 / A-03.2)

Màn: `AdminDeptAttendanceDetailPage` · VM: `AdminDeptAttendanceViewModel` · Component: `Controls/TablePaginationBar`.

| Mục | Quy tắc |
|-----|---------|
| PageHeader (D-UI.40) | Title `CHI TIẾT ĐƠN VỊ` (`AdminUiStrings.DeptDetailTitle`) — IN HOA · §2.7.7 |
| KPI dashboard card | **Không** hiển thị card KPI inline — tiến độ `PageHeader.Subtitle` ngay dưới title (`Đã chấm … · toàn đơn vị` · ngày) — D-UI.39 / D-UI.45 · **cấm** `ActionsContent` |
| «Chưa chấm» | ComboBox tooltip `UncheckedFilterTooltip` — `!isComplete` · **cấm** hiểu là chưa có trạng thái |
| Filter | **Một** card gộp: đơn vị · ngày · ô tìm NV · trạng thái · **Tìm kiếm** · **Xóa lọc** · **Làm mới** · unlock/relock/approve · **Xuất báo cáo** |
| Lọc client-side | Search + trạng thái **draft** — apply khi **Tìm kiếm** cùng đơn vị/ngày (D-UI.48) · **cấm** live khi gõ/đổi combo · **cấm** card filter riêng thứ hai |
| Layout page | 5 hàng Grid: header · lock banner · messages · filter card · card bảng `*` `MinHeight=0` |
| Card bảng | Pattern §2.8: tiêu đề · `DataGrid` scroll · `TablePaginationBar` · panel «Chấm nhanh» (chỉ khi có `SelectedStaff`) |
| DataGrid scroll | `VerticalScrollBarVisibility=Auto`; `HorizontalScrollBarVisibility=Auto`; `MinWidth=860` |
| Phân trang | **Bắt buộc** `TablePaginationBar` §2.10; `UnitLabel` = `nhân viên` |
| Chấm nhanh | Trong card bảng, dưới pagination; `MaxHeight=120` + scroll nếu nhiều nút |
| Parity Web | Web vẫn có KPI bar — desktop **bỏ** theo ticket; modal Excel/quét/giờ — phase A-08 |

#### 2.11.3 Admin Chi tiết đơn vị — parity thao tác (A-03.3 / D-UI.8)

Màn: `AdminDeptAttendanceDetailPage` · VM: `AdminDeptAttendanceViewModel` · API: `AttendanceApiClient` + `AdminApiClient`.

| Mục | Quy tắc |
|-----|---------|
| Xuất báo cáo | Client-side Excel qua `ExcelFileService` + `DeptAttendanceExcelRegistry`; export toàn bộ roster đã load (`_allStaff`) — parity `useDeptAttendanceDetail.handleExport` |
| Chi tiết quét | `ScanLogDialog` — `GET /api/attendance/scan-logs`; phân trang server-side 20/trang |
| Điền giờ | `FillAttendanceTimesDialog` — `PUT /api/admin/attendance/times`; chỉ slot trống; cần `missingPunchReason` |
| Duyệt bổ sung giờ | `ApprovePayrollFillDialog` — `POST /api/admin/attendance/payroll-fill/approve` khi `payrollFillStatus=PENDING` + nghỉ trực |
| Đưa về chưa chấm | `ClearAttendanceDialog` — `POST /api/admin/attendance/clear`; lý do bắt buộc |
| Cột THAO TÁC | Nút **«Thao tác»** → `ContextMenu` gồm Quét · lịch thủ công · điền giờ / duyệt / clear (§2.11.4) |
| Helper | `AttendanceActionHelper` — mirror `canAdminFillTimes`, `canAdminApprovePayrollFill`, `canClear` từ Web |
| Staff row | Map thêm `missingPunchReason`, `payrollFillStatus`, `payrollIntentLabel` từ API |

#### 2.11.4 Admin Chi tiết đơn vị — filter parity & menu thao tác (D-UI.10 / A-03.4)

Parity `DepartmentCatalogPage` filter · pattern menu `StaffCatalogPage` D4.4.1.

| Mục | Quy tắc |
|-----|---------|
| Filter layout | **Grid 2 hàng** trong cùng card §2.11.2 — hàng 1: scope + tìm NV; hàng 2: unlock/export |
| Label filter | **`FilterToolbarLabelStyle`** — cấm `FontSizeSm` + `ContentMutedBrush` |
| Nút filter | **`FilterToolbarPrimaryButtonStyle`** (primary light §2.7.1) / **`FilterToolbarSecondaryButtonStyle`** — cấm `PrimaryButtonStyle` / `SecondaryButtonStyle` thuần |
| Approve unlock | **`FilterToolbarNavyButtonStyle`** (navy) — không dùng primary light |
| DatePicker | **`FilterDatePickerStyle`** — Height **42**, căn baseline ComboBox |
| Baseline | ComboBox · DatePicker · TextBox · nút — **MinHeight 42–44**, `VerticalAlignment="Center"` |
| THAO TÁC UI | **Một** nút `DeptDetailActionsMenu` — width **120** |
| Menu items (thứ tự) | **Chi tiết quét** · **Lịch thủ công** · **Điền giờ** · **Duyệt bổ sung giờ** · **Đưa về chưa chấm** (conditional `AttendanceActionHelper`) |
| Cấm | Nút «Chi tiết quét» riêng trên hàng |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.10a | SPEC §2.11.4 | [x] |
| D-UI.10b | `FilterDatePickerStyle` | [x] |
| D-UI.10c | `AdminDeptAttendanceDetailPage.xaml` — filter + THAO TÁC | [x] |
| D-UI.10d | `AdminDeptAttendanceDetailPage.xaml.cs` — menu gộp Quét | [x] |

#### 2.11.5 Admin Chi tiết đơn vị — thứ tự filter & DatePicker (D-UI.11 / A-03.5)

Bổ sung §2.11.4 — hàng 1 filter **một dòng**, thứ tự cố định trái → phải.

| Mục | Quy tắc |
|-----|---------|
| Hàng 1 (trái → phải) | **Chọn đơn vị** · **Chọn ngày** · ô tìm (placeholder) · **Trạng thái** · **Tìm kiếm** · **Xóa lọc** · **Làm mới** |
| Hàng 2 | Giữ nguyên §2.11.4 — unlock / export |
| Label ô tìm | **Cấm** «Họ tên» cạnh ô (D-UI.49) — watermark đủ nghĩa |
| TextBox tìm | `FilterTextBoxStyle` · Width **360** · `Tag`/`ToolTip` = `DeptDetailSearchPlaceholder` |
| Làm mới | **`FilterToolbarPrimaryButtonStyle`** (§2.7.1) trong hàng 1 — icon `&#xE72C;` + spin khi `IsRefreshing` · `RefreshCommand` |
| PageHeader | **Không** có nút Làm mới trong `ActionsContent` |
| Tìm kiếm vs Làm mới | **Tìm kiếm** = `ApplyFilterCommand` (apply đơn vị + ngày draft) · **Làm mới** = `RefreshCommand` (reload API) |
| DatePicker | `FilterDatePickerStyle` — text **căn giữa** theo chiều dọc trong ô 42px · hiển thị **`dd/MM/yyyy`** (§2.7.6) |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.11a | SPEC §2.11.5 | [x] |
| D-UI.11b | `FilterDatePickerStyle` — vertical center text | [x] |
| D-UI.11c | `AdminDeptAttendanceDetailPage.xaml` — reorder filter + Làm mới | [x] |
| D-UI.11d | `AdminUiStrings.DeptDetailSearchLabel` | [x] |

#### 2.11.6 Đồng bộ số liệu Tổng quan ↔ Chi tiết ↔ filter Chưa chấm (D-DATA.1)

Audit WPF: cùng chữ «Chưa chấm / số NV / khoa» nhưng công thức lệch. Ticket này **chỉ** khớp tiến độ chấm công giữa Tổng quan, Chi tiết đơn vị, HEAD Chấm công — **không** đổi định nghĩa số NV catalog (active vs tất cả).

| Mục | Quy tắc |
|-----|---------|
| Filter «Chưa chấm» | HEAD + Admin Chi tiết: `!isComplete` — cùng `AttendanceValidity.isComplete` / KPI `uncheckedCount` / Web `isAttendanceUnchecked`. **Cấm** `status == null` |
| API | `StaffAttendanceDto.complete` (`boolean`) — BE set từ `AttendanceValidity.isComplete(record)` (`false` khi không record) |
| WPF row | `IsUnchecked = !IsComplete`; `Complete` từ API, fallback `AttendanceCompleteness` (mirror Web) |
| Badge | Giữ `statusLabel` / «Đi làm» khi đã có status — **không** đổi badge thành «Chưa chấm» chỉ vì thiếu giờ |
| KPI HEAD | Hiện **mọi** pill `Count > 0` — **cấm** `.Take(8)` cắt so với `MarkedCount` |
| Default khoa Chi tiết | `OrderBy(DeptCode)` — khoa mã nhỏ nhất khi vào nav trực tiếp. **Cấm** `_departments[0]` theo thứ tự API |
| Nav Tổng quan → Chi tiết | Menu **Quản lý** item đầu **Xem chi tiết** → `dashboard-dept` kèm `deptCode` + `attendanceDate` (ngày dashboard = hôm nay VN) |
| Shell | `NavigateToDeptDetail(deptCode, date)` set draft+applied trên `AdminDeptAttendanceDetailPage` rồi load |
| Combo lọc Tổng quan | Chỉ khoa **có trong payload dashboard** (active hôm nay) + «Tất cả» — **cấm** catalog inactive làm KPI trống |
| Subtitle Tổng quan | **Cấm** `PageHeader.Subtitle` (D-UI.43) — phạm vi khoa nằm ở filter đã Apply, không dưới title |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-DATA.1a | SPEC §2.11.6 + SPEC_HEAD «Chưa chấm» | [x] |
| D-DATA.1b | API `complete` trên `StaffAttendanceDto` | [x] |
| D-DATA.1c | WPF filter + `AttendanceCompleteness` + bỏ Take(8) | [x] |
| D-DATA.1d | Nav Tổng quan → Chi tiết + default `OrderBy` + combo dashboard | [x] |

### 2.12 Admin catalog — Cấp bậc & Chức vụ (D4.0 / D4.1 / A-04.0–A-04.2)

Reference Web: `StaffAttributeCatalogPage.jsx` · `useStaffAttributeCatalogPage.js` · API `/api/admin/staff-ranks` · `/api/admin/staff-positions`.

| Mục | Quy tắc |
|-----|---------|
| Phạm vi D4.1 | Màn **Cấp bậc** (`ranks`) và **Chức vụ** (`positions`) — shared pattern `StaffAttributeCatalogPage` |
| API | `GET/POST /staff-ranks` · `PUT/DELETE /staff-ranks/{code}` · `GET /staff-ranks/next-code`; tương tự `staff-positions` |
| Shared UI | Một `UserControl` + `StaffAttributeCatalogViewModel` parameterized theo loại catalog; **cấm** duplicate logic CRUD |
| PageHeader (D-UI.36) | Chỉ `PageTitle` — **cấm** `PageSubtitle` dưới tiêu đề · Cấp bậc · Chức vụ · Trạng thái · Đơn vị · Nhân viên ADMIN · Nhân viên HEAD (§2.20.4) |
| Stat grid | 3 thẻ: **Tổng** · **Đang sử dụng** · **Ngưng sử dụng** — tính client-side trên full list |
| Tìm kiếm | TextBox draft + watermark `SearchPlaceholder` (`Tag`) + nút **Tìm kiếm** + **Xóa lọc** + **Làm mới** (D-UI.41) — lọc theo mã (formatted) hoặc tên (case-insensitive) |
| Bảng | Cột **STT** (§2.8.1) · **MÃ** · **TÊN** · **THỨ TỰ** · **NHÂN VIÊN** (`usageCount`) · **TRẠNG THÁI** (`StatusBadge`) · **THAO TÁC** (Sửa / Xóa); **căn cột** theo §2.12.2 · **header/width** theo §2.12.3 |
| Phân trang | **Bắt buộc** `TablePaginationBar` (§2.10); `UnitLabel` = `cấp bậc` / `chức vụ` |
| CRUD form | Dialog modal: mã (readonly, auto `next-code` khi tạo) · tên (bắt buộc) · thứ tự · checkbox trạng thái |
| Xóa | Chỉ khi `usageCount == 0`; disabled + tooltip khi đang có nhân viên; confirm dialog trước khi xóa |
| Excel import/export | **A-08.1** — §2.16 (Cấp bậc · Chức vụ) |
| Nav shell | `MainShellWindow` route `ranks` → page cấp bậc; `positions` → page chức vụ |

#### 2.12.1 Checklist ticket

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| A-04.0 | Foundation: Core DTOs, `AdminApiClient`, shared VM/page pattern | [x] D4.0 |
| A-04.1 | Danh mục **Cấp bậc** — list, search, pagination, CRUD | [x] D4.1 |
| A-04.2 | Danh mục **Chức vụ** — cùng pattern A-04.1 | [x] D4.1 |
| A-04.3 | Danh mục **Trạng thái chấm công** | [x] D4.2 |
| A-04.4 | Danh mục **Đơn vị** | [x] D4.3 |
| A-04.5 | Danh mục **Nhân viên** | [x] D4.4 |

#### 2.12.2 Admin catalog compact — căn đều cột bảng (D4 polish)

**Phạm vi:** `StaffAttributeCatalogPage` (Cấp bậc · Chức vụ) · `AttendanceStatusCatalogPage` (Trạng thái chấm công).

| Mục | Quy tắc |
|-----|---------|
| Vấn đề cấm | Một cột `Width="*"` duy nhất trên màn catalog ít cột — gây khoảng trống giữa bảng khi shell maximized; **header trái + cell giữa/phải** trên cùng cột |
| Nguyên tắc width | Chỉ **một** cột mô tả (`TÊN` / `TÊN HIỂN THỊ`) dùng `*` + `MaxWidth`; các cột còn lại **fixed px** — khoảng dư nằm **bên phải** bảng, không chen giữa các cột |
| Cột fixed (Rank/Position) | **STT** 56 · **MÃ** 90 · **THỨ TỰ** 88 · **NHÂN VIÊN** 100 · **TRẠNG THÁI** 160 · **THAO TÁC** 120 |
| Cột flex (Rank/Position) | **TÊN** `*` MinWidth 180 · **MaxWidth 420** |
| Cột fixed (Status) | **STT** 56 · **MÃ** 140 (D-UI.56) · **NHÃN BADGE** 180 · **THỨ TỰ** 88 · **SỬ DỤNG** 100 · **TRẠNG THÁI** 160 · **THAO TÁC** 120 |
| Cột flex (Status) | **TÊN HIỂN THỊ** `*` MinWidth 160 · **MaxWidth 420** |
| Căn header + cell | **Cùng hướng căn** trên từng cột — parity Web `table-th-left` |
| Cột trái | STT (header+cell **giữa**) · Mã · Tên · Thứ tự · Nhân viên/Sử dụng · Badge · Trạng thái |
| **THAO TÁC** | Giống `DepartmentCatalogPage` (§2.14): header **trái** (mặc định) · `StackPanel` nút **`HorizontalAlignment="Right"`** · **Sửa** `SecondaryButtonStyle` Padding `8,4` Margin `0,0,6,0` · **Xóa** danger + disabled khi blocked |
| Badge | `StatusBadge` căn **trái** trong cell (không float giữa cột) |
| Parity Web | Layout desktop **fill card** như `w-full` React — không để vùng trống giữa các nhóm cột |
| Shared | Cùng recipe width cho Rank và Position (shared page); Status page mirror tỷ lệ tương đương |
| Phạm vi ngoài | **Không** áp dụng cho Đơn vị / Nhân viên (nhiều cột, layout riêng) |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| A-04.1.1 | Polish căn đều cột bảng catalog compact (§2.12.2) | [x] D4 polish |

#### 2.12.3 Catalog compact — header parity & width (D4.1.2)

Parity §2.14.3 / §2.15.1 — `x:Static` · `AdminDataGridColumnHeaderCatalogStyle` · không clip header IN HOA.

| Mục | Quy tắc |
|-----|---------|
| Header source | `{x:Static catalog:CatalogUiStrings+…}` — cột **TÊN** (Rank/Position shared page) giữ `TextBlock` trong `<Column.Header>` vì nhãn động |
| Header style | **`AdminDataGridColumnHeaderCatalogStyle`** · STT → **`CatalogCenterStyle`** |
| Grid | `HorizontalAlignment="Stretch"` · `HorizontalScrollBarVisibility="Auto"` |
| Rank/Position fixed | **STT** 72 · **MÃ** 96 · **THỨ TỰ** 112 · **NHÂN VIÊN** 128 · **TRẠNG THÁI** 168 · **THAO TÁC** 128 |
| Rank/Position flex | **TÊN** `*` MinWidth 150 MaxWidth 280 |
| Status fixed | **STT** 72 · **MÃ** **140** (D-UI.56, was 120) · **NHÃN BADGE** 200 · **THỨ TỰ** 112 · **SỬ DỤNG** 112 · **TRẠNG THÁI** 168 · **THAO TÁC** 128 |
| Status flex | **TÊN HIỂN THỊ** `*` MinWidth 150 MaxWidth 280 |
| Badge cell | `FontSizeSm` token — **cấm** hardcode 11 |
| MinWidth grid | Rank/Position **860** · Status **960** |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D4.1.2a | SPEC §2.12.3 | [x] |
| D4.1.2b | `StaffAttributeCatalogPage` — headers + widths | [x] |
| D4.1.2c | `AttendanceStatusCatalogPage` — headers + widths | [x] |
| D-UI.56 | Trạng thái chấm công — cột MÃ Width 140 (§2.12.3) | [x] |

### 2.13 Admin catalog — Trạng thái chấm công (D4.2 / A-04.3)

Reference Web: `StatusCatalogPage.jsx` · `useStatusCatalogPage.js` · API `/api/admin/attendance-status-types`.

| Mục | Quy tắc |
|-----|---------|
| View | `AttendanceStatusCatalogPage` · nav id `statuses` |
| PageHeader | Chỉ `PageTitle` — **cấm** subtitle (D-UI.36) |
| API | `GET/POST /attendance-status-types` · `PUT/DELETE /attendance-status-types/{id}` |
| Stat grid | Giống §2.12 — Tổng / Đang sử dụng / Ngưng sử dụng |
| Tìm kiếm | Lọc theo `code`, `label`, `badgeLabel` (case-insensitive) |
| Bảng | **STT** · **MÃ** · **TÊN HIỂN THỊ** · **NHÃN BADGE** (dot màu + text) · **THỨ TỰ** · **SỬ DỤNG** · **TRẠNG THÁI** · **THAO TÁC**; **căn cột** theo §2.12.2 · **header/width** theo §2.12.3 |
| Phân trang | `TablePaginationBar` · `UnitLabel` = `trạng thái` |
| Form dialog | `AttendanceStatusCatalogFormDialog` — parity Web `StatusCatalogFormModal.jsx` (§2.13.1) |
| Màu / icon | Options parity Web `STATUS_CATALOG_COLOR_OPTIONS` / `STATUS_CATALOG_ICON_OPTIONS` |
| Xóa | Chỉ khi `usageCount == 0`; tooltip «Đang có N bản ghi Chấm công…» khi blocked |
| Excel import/export | **A-08.2** — §2.16.4 |

#### 2.13.1 Form dialog — Thêm / Sửa trạng thái (parity Web)

Reference Web: `StatusCatalogFormModal.jsx` · `slugifyCode` · `parseActiveStatus` (client validate only).

| Mục | Quy tắc |
|-----|---------|
| Kích thước | `Width=580` · `MinWidth=580` · `Height=720` · `MinHeight=520` · `MaxHeight` ≈ 90% màn hình làm việc · `ResizeMode=CanResize` · **không** `SizeToContent` |
| Bố cục | **Nút Lưu/Hủy cố định** dưới cùng (không cuộn) · vùng trường trong `ScrollViewer` `VerticalScrollBarVisibility=Auto` khi nội dung vượt chiều cao (DPI cao / màn nhỏ) |
| Trường | Mã · Tên hiển thị · Nhãn badge · Màu · Icon · Thứ tự · Cho phép chấm thủ công · Là trạng thái cha · Trạng thái cha (ẩn khi cha) · Trạng thái sử dụng |
| Nhãn UI | `CatalogUiStrings.StatusCatalog.Form*` — **cấm** hardcode tiếng Việt trong XAML |
| Tạo mới — mã | Auto-slug từ **Tên hiển thị** khi ô mã **đang trống** (`StatusCatalogCodeHelper.SlugifyCode`); uppercase khi gõ |
| Tạo mới — badge | Auto `Tên hiển thị`.ToUpper() khi ô badge **đang trống** |
| Sửa — mã | Readonly + nền `PrimaryLight` (không đổi mã sau tạo) |
| Mặc định tạo | `colorKey=green` · `iconKey=check` · `sortOrder=0` · `active=true` · `manualAllowed=false` · `groupParent=false` |
| `groupParent` | Tick → ẩn ComboBox trạng thái cha · clear `parentCode` |
| Combo trạng thái cha | Option đầu = placeholder `FormParentCodePlaceholder` · các option = trạng thái `groupParent=true` (loại trừ chính nó) · hiển thị `code - label` |
| Thứ tự | Ô trống → `0`; số âm / không hợp lệ → lỗi client |
| Validate client | Tên · Mã · Nhãn badge bắt buộc (message parity Web) |
| Lỗi API | Hiển thị **trong dialog** (`ErrorText`) — không chỉ `ViewModel.ErrorMessage` phía sau |
| Payload | `parentCode=""` khi `groupParent=true`; uppercase mã khi lưu |

### 2.14 Admin catalog — Đơn vị (D4.3 / A-04.4)

Reference Web: `DepartmentsPage.jsx` · API `/api/admin/departments` · `/api/admin/department-groups` · `/api/admin/stats`.

| Mục | Quy tắc |
|-----|---------|
| View | `DepartmentCatalogPage` · nav id `departments` |
| PageHeader | Chỉ `PageTitle` — **cấm** subtitle (D-UI.36) |
| Stat grid | **Tổng đơn vị** · **Tổng nhân viên** · **Tỷ lệ hoạt động** (`activePercent%`) — từ `GET /admin/stats` |
| Lọc | ComboBox **nhóm đơn vị** (Tất cả + groups) + TextBox tìm Width **440** (full `SearchPlaceholder` — D-UI.50) + **Tìm kiếm** / **Xóa lọc** / **Làm mới** (D-UI.41) — **cấm** Làm mới trên `PageHeader` |
| Tìm kiếm | `deptName`, `unitCode`, `deptCodeFormatted`, `groupName`, `headName` |
| Cột KHỐI | Hiện khi lọc = **Tất cả**; ẩn khi đã chọn 1 nhóm |
| Bảng | **STT** · **MÃ ĐƠN VỊ** (`dept_code` padded 01…) · **KHỐI** (tuỳ chọn) · **KÝ HIỆU ĐƠN VỊ** (`unitCode`, vd. A2 / C11) · **TÊN ĐƠN VỊ** · **TRƯỞNG ĐƠN VỊ** · **QUÂN SỐ** · **THAO TÁC** (Sửa / Xóa) — D-UI.44 |
| Cột THAO TÁC | Width **120** · header trái · nút `HorizontalAlignment="Right"` trong cell — **reference** cho catalog compact (§2.12.2) |
| Phân trang | `TablePaginationBar` · `UnitLabel` = `đơn vị` |
| Form đơn vị | Mã PK (readonly, `next-code` khi tạo) · nhóm (bắt buộc) · **ký hiệu đơn vị** (vd: C11) · tên · trưởng đơn vị (chỉ khi **sửa**, staff thuộc đơn vị) |
| Quản lý nhóm | Dialog `DepartmentGroupManageDialog` — CRUD nhóm (`department-groups`) |
| Xóa đơn vị | Chỉ khi `staffCount == 0` |
| Xóa nhóm | Chỉ khi `deptCount == 0` |
| Excel import/export | **A-08.3** — §2.16.5 |

#### 2.14.1 Danh mục Đơn vị — layout polish (D4.3.1)

Reference screenshot / Web parity: header không cắt chữ · stat label đọc rõ · filter label cùng cỡ nút Tìm kiếm.

| Mục | Quy tắc |
|-----|---------|
| Stat label | «Tổng đơn vị» · «Tổng nhân viên» · «Tỷ lệ hoạt động» — `FontSizeStatLabel` (20) token (D-UI.42) — **cấm** `FontSizeMd` (16 quá nhỏ) |
| Stat value | `FontSizeXl` (27) token — **cấm** hardcode 12/24 |
| Control stat | `CatalogStatGrid` — áp dụng token; side-effect đồng bộ catalog khác dùng control này |
| Filter label | «Lọc theo nhóm» — style **`FilterToolbarLabelStyle`**: `FontSizeMd`, SemiBold, `ContentHeadingBrush` — **cùng cỡ** chữ «Tìm kiếm» |
| Ô tìm | Width **440** — full hint «Tìm theo mã, ký hiệu, tên, trưởng đơn vị...» (D-UI.50) |
| Cột fixed | **STT** 56 · **MÃ ĐƠN VỊ** 120 · **KHỐI** 96 · **KÝ HIỆU ĐƠN VỊ** 160 · **Trưởng đơn vị** 160 · **QUÂN SỐ** 108 · **THAO TÁC** 120 |
| Cột flex | **TÊN ĐƠN VỊ** `*` MinWidth 200 · MaxWidth 480 |
| Header QUÂN SỐ | `AdminDataGridColumnHeaderCenterStyle` |
| Scroll | `HorizontalScrollBarVisibility=Auto` · `MinWidth` grid ≥ 860 |
| Nguyên tắc width | Một cột `*`; khoảng dư bên phải bảng — mirror §2.12.2 |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D4.3.1a | SPEC §2.14.1 | [x] |
| D4.3.1b | `FilterToolbarLabelStyle` | [x] |
| D4.3.1c | `CatalogStatGrid` token typography | [x] |
| D4.3.1d | `DepartmentCatalogPage` filter + column widths | [x] |

#### 2.14.2 Danh mục Đơn vị — header parity & width fix (D4.3.2)

Fix header cắt mép · khoảng trống giữa bảng · chuỗi lệch Web (`admin.js` departments.columns).

| Mục | Quy tắc |
|-----|---------|
| Header text | Parity Web: **MÃ Đơn vị** · **TÊN Đơn vị** (không IN HOA toàn bộ) |
| Header XAML | **`DataGridColumn.Header` cấm `{Binding}`** (không phải DP) — xem §2.14.3 |
| Padding header | Style **`AdminDataGridColumnHeaderCatalogStyle`** — `Padding 12,12` (catalog nhiều cột) |
| Cột fixed | **STT** 72 · **MÃ Đơn vị** 136 · **KHỐI** 88 · **MÃ đơn vị** 120 · **Trưởng đơn vị** 168 · **QUÂN SỐ** 112 · **THAO TÁC** 128 |
| Cột flex | **TÊN Đơn vị** `*` MinWidth 180 — **bỏ MaxWidth** |
| Fill card | `HorizontalAlignment="Stretch"` — cột `*` chiếm phần còn lại, không để gap trống |
| STT / QUÂN SỐ | `AdminDataGridColumnHeaderCatalogCenterStyle` |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D4.3.2a | SPEC §2.14.2 | [x] |
| D4.3.2b | `CatalogUiStrings` header parity Web | [x] |
| D4.3.2c | Catalog header styles + `DepartmentCatalogPage` columns | [x] |

#### 2.14.3 Danh mục Đơn vị — header hiển thị (D4.3.3)

Hotfix regression D4.3.2: header giữa bảng trống vì `{Binding}` trên `DataGridColumn.Header` **không hoạt động** trong WPF.

| Mục | Quy tắc |
|-----|---------|
| Header source | `{x:Static catalog:CatalogUiStrings+Departments.Col*}` trên `DepartmentCatalogPage` |
| Namespace XAML | `xmlns:catalog="clr-namespace:BV87.Core.Constants;assembly=BV87.Core"` |
| Cấm | `Header="{Binding ...}"` trên `DataGridTextColumn` / `DataGridTemplateColumn` |
| Thay thế OK | `x:Static` từ `CatalogUiStrings` **hoặc** `TextBlock` lồng trong `<Column.Header>` |
| Constants | Thêm `ColStt` · `ColActions` trong `CatalogUiStrings.Departments` |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D4.3.3 | Hotfix header `x:Static` (§2.14.3) | [x] |

#### 2.14.4 Danh mục Đơn vị — cấp bậc trưởng đơn vị (D4.3.4)

| Mục | Quy tắc |
|-----|---------|
| Cột Trưởng đơn vị | Dòng `HeadRank` (cấp bậc) — `FontSizeSm` (14) token · `ContentMutedBrush` |
| Cấm | Hardcode `FontSize="11"` |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D4.3.4 | Cột Trưởng đơn vị — tăng cỡ chữ cấp bậc (§2.14.4) | [x] |

#### 2.14.5 Danh mục Đơn vị — header IN HOA & cân cột (D4.3.5)

| Mục | Quy tắc |
|-----|---------|
| Header table | Toàn bộ cột — **IN HOA** trong `CatalogUiStrings.Departments.Col*` |
| TÊN ĐƠN VỊ |  Width **350** Trưởng đơn vị |
| TRƯỞNG ĐƠN VỊ | Width **200** · `HeadDisplay` `TextWrapping="Wrap"` |
| MÃ ĐƠN VỊ | Chỉ khóa chính padded `dept_code` (01…) — **cấm** dùng nhãn này cho `unitCode` |
| KÝ HIỆU ĐƠN VỊ | `unitCode` (C11 / A2); trống → «—» |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D4.3.5 | Header IN HOA + cân width TÊN / TRƯỞNG (§2.14.5) | [x] |

#### 2.14.6 Ký hiệu đơn vị vs mã PK (D-UI.44)

`dept_code` (INT, padded 01…) là khóa chính. `unitCode` (C11 / A2) là ký hiệu hiển thị. **Không** đổi schema PK.

| Mục | Quy tắc |
|-----|---------|
| Danh mục Đơn vị | Cột 1 **MÃ ĐƠN VỊ** = `DeptCodeFormatted` · cột 2 (sau KHỐI) **KÝ HIỆU ĐƠN VỊ** = `unitCode` |
| Form | Label PK «Mã đơn vị» (readonly) · field `unitCode` «Ký hiệu đơn vị (vd: C11)» |
| Nhãn ghép màn khác | `{unitCode} - {deptNameDisplay\|\|deptName}` — dấu ` - ` (space-hyphen-space) |
| Không có `unitCode` | Chỉ `{deptNameDisplay\|\|deptName}` — **cấm** prefix `01` / `[01]` như thể ký hiệu |
| Phạm vi | Combo lọc Đơn vị · cột ĐƠN VỊ (NV, phân quyền, token kiosk, mở khóa, lịch sử chuyển, audit, nhắc nhở, tổng quan) · Excel export NV |
| API | Thêm `unitCode` (và `deptName` khi thiếu) trên DTO đã có `deptCode` — không đổi PK |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.44a | SPEC §2.14.6 | [x] |
| D-UI.44b | Catalog: cột/form KÝ HIỆU ĐƠN VỊ | [x] |
| D-UI.44c | Formatter + màn Admin khác + API `unitCode` | [x] |

### 2.15 Admin catalog — Nhân viên (D4.4 / A-04.5)

Reference Web: `StaffPage.jsx` · API `/api/admin/staff` (paginated) · transfer · department-history.

| Mục | Quy tắc |
|-----|---------|
| View | `StaffCatalogPage` · nav id `staff` (ADMIN only) |
| PageHeader | Chỉ `PageTitle` — **cấm** subtitle (D-UI.36) |
| Phân trang | **Server-side** — `RegistryPageDto`; vẫn dùng `TablePaginationBar` (§2.10.2 exception) |
| Stat grid | **Tổng nhân viên** · **Đang hoạt động** · **Ngưng hoạt động** — từ `GET /admin/stats` |
| Lọc | ComboBox đơn vị + TextBox tìm (watermark) + **Tìm kiếm** / **Xóa lọc** / **Làm mới** (D-UI.41) → query API — **cấm** Làm mới trên `PageHeader` |
| Bảng | **STT** · **ĐƠN VỊ** (`{unitCode} - {tên}` — D-UI.44) · **ẢNH ĐẠI DIỆN** · **MÃ NV** · **HỌ TÊN** · **CẤP BẬC** · **CHỨC VỤ** · **TRẠNG THÁI** · **VÂN TAY** · **THAO TÁC** (menu — §2.15.1) |
| Cột THAO TÁC | Nút **«Thao tác»** → `ContextMenu` (Sửa · Chuyển ĐV · Lịch sử · Xóa vân tay · Xóa); width **120**; **Xóa vân tay** enable khi `fingerprintRegistered`; confirm VN → `DELETE /api/admin/fingerprints/{empCode}` |
| CRUD form | Tên · đơn vị · cấp bậc/chức vụ (ComboBox catalog) · active · **ảnh đại diện**; đổi đơn vị khi sửa → lý do + thu hồi HEAD nếu cần |
| Chuyển đơn vị | Dialog riêng `StaffTransferDialog` — `POST /staff/{empCode}/transfer` |
| Lịch sử | Dialog `StaffTransferHistoryDialog` — `GET /staff/{empCode}/department-history` |
| Avatar upload | **D-STAFF.1** — form Sửa/Tạo + menu THAO TÁC **Ảnh đại diện** → `StaffAvatarDialog` (§2.15.3). `avatarUrl` data URL JPG/PNG/GIF/WEBP ≤ 5MB (`ImageDataUrlHelper`). HEAD: `HeadStaffFingerprintPage` — `PATCH /api/head/staff/{empCode}/avatar` |
| Excel | **A-08.4** — §2.16.6 |
| Xóa vân tay | Menu **Xóa vân tay** — ADMIN mọi NV; `SPEC_FINGERPRINT` §5.1 P2.4 |

#### 2.15.1 Danh mục Nhân viên — layout & menu thao tác (D4.4.1)

Parity §2.14 (Danh mục đơn vị) · pattern menu `AdminDeptAttendanceDetailPage`.

| Mục | Quy tắc |
|-----|---------|
| Header source | `{x:Static catalog:CatalogUiStrings+Staff.Col*}` — **cấm** `{Binding}` trên `DataGridColumn.Header` (§2.14.3) |
| Header style | **`AdminDataGridColumnHeaderCatalogStyle`** · STT → **`CatalogCenterStyle`** |
| Filter label | «Lọc theo đơn vị» → **`FilterToolbarLabelStyle`** |
| Grid fill | `HorizontalAlignment="Stretch"` · `MinWidth="960"` · `HorizontalScrollBarVisibility="Auto"` |
| Cột fixed | **STT** 72 · **ĐƠN VỊ** 220 · **ẢNH ĐẠI DIỆN** 140 · **MÃ NV** 96 · **CẤP BẬC** 128 · **CHỨC VỤ** 148 · **TRẠNG THÁI** 168 · **VÂN TAY** 200 · **THAO TÁC** 120 |
| Cột flex | **HỌ VÀ TÊN** `*` MinWidth 150 MaxWidth 220 — **một** cột `*` duy nhất |
| ĐƠN VỊ / VÂN TAY | `TextWrapping="Wrap"` |
| THAO TÁC UI | Nút **«Thao tác»** (`ActionsMenuLabel`) → `ContextMenu` trong code-behind |
| Menu items | **Sửa** · **Ảnh đại diện** · **Chuyển ĐV** · **Lịch sử** · **Xóa vân tay** (disabled nếu chưa ĐK) · **Xóa** |
| Web parity | Web giữ icon row — menu chỉ desktop WPF |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D4.4.1a | SPEC §2.15.1 | [x] |
| D4.4.1b | `CatalogUiStrings.Staff` — ColStt, ColActions, ActionsMenuLabel, action labels | [x] |
| D4.4.1c | `StaffCatalogPage.xaml` — columns + x:Static headers | [x] |
| D4.4.1d | `StaffCatalogPage.xaml.cs` — `ActionsMenuButton_Click` | [x] |

#### 2.15.4 Cột ảnh đại diện bảng NV (D-STAFF.1c)

ADMIN `StaffCatalogPage` + HEAD `HeadStaffFingerprintPage` — **cấm** đổi API.

| Mục | Quy tắc |
|-----|---------|
| Vị trí | Cột **ẢNH ĐẠI DIỆN** **ngay trước MÃ NV** (Admin: sau ĐƠN VỊ · trước MÃ NV; HEAD: sau STT · trước MÃ NV) |
| Cell | Vòng **36** · clip `EllipseGeometry` · `avatarUrl` hoặc initials · viền `LineBrush` · căn giữa |
| Header | `{x:Static …ColAvatar}` = `ẢNH ĐẠI DIỆN` · width **140** (đủ 1 dòng, không cắt tiêu đề) · header center |
| Binding | `StaffAvatarThumb` + `AvatarUrl` / `Initials` — **cấm** avatar trong cell Họ tên |
| Cập nhật | Sau dialog lưu: Admin reload trang; HEAD gán `AvatarUrl` có `INotifyPropertyChanged` |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-STAFF.1c | Cột Ảnh đại diện trước MÃ NV — Admin + HEAD (§2.15.4) | [x] |

#### 2.15.2 Danh mục Nhân viên — cột VÂN TAY (D4.4.2)

| Mục | Quy tắc |
|-----|---------|
| Cột VÂN TAY | Width **200** — đủ hiển thị «Đã đăng ký — ngón cái phải» trên một dòng (hoặc wrap ít hơn) |
| Pagination | Typography footer — §2.10 (shared `TablePaginationBar`) |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D4.4.2a | SPEC §2.15.2 + §2.10 typography | [x] |
| D4.4.2b | `StaffCatalogPage` — VÂN TAY width 200 | [x] |
| D4.4.2c | `TablePaginationBar` + pagination styles — `FontSizeMd`, 36px controls | [x] |

#### 2.15.3 Dialog ảnh đại diện (D-STAFF.1a)

`StaffAvatarDialog` — ADMIN catalog + HEAD danh mục NV. **Cấm** đổi API / `ImageDataUrlHelper`.

| Khối | Rule |
|------|------|
| Header | Icon **avatar** (Contact) Segoe `&#xE77B;` trong vòng `PrimaryLightBrush` **cạnh** title in-dialog · **Window.Icon** chrome = glyph Contact `E77B` (§2.6.1 / D-UI.35) — **cấm** logo BV · **cấm** icon mặc định document · **cấm** `E91E` |
| Preview | **Một** vòng 128 · clip `EllipseGeometry` (ảnh + overlay cùng hình tròn) · viền `Ellipse` `PrimaryBrush` · initials hoặc ảnh · **cấm** ảnh/scrim vuông chồng lên khung tròn |
| Overlay chọn | Mũi tên upload `&#xE896;` giữa preview (scrim `NavyBrush` opacity) · click = `OpenFileDialog` · tooltip `AvatarPickFromComputer` · **cấm** nút «Chọn ảnh từ máy tính» dưới preview |
| Overlay xóa | Dấu **X** `&#xE711;` góc trên **phải** vòng ảnh · tooltip `AvatarRemove` · chỉ hiện khi đang có ảnh · click = xóa · **cấm** nút «Xóa ảnh hiện tại» dưới preview |
| Hint | Banner `PrimaryLightBrush` + icon Info `&#xE946;` · `AvatarNote` + `AvatarHint` |
| Footer | Hàng riêng `BorderBrush=Line` phía trên · nền `SurfacePage` · **Hủy** `SecondaryButtonStyle` · **Lưu** `PrimaryButtonStyle` căn phải |
| Token | Chỉ brush / style theme — **cấm** hex inline |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-STAFF.1a | SPEC §2.15.3 + `StaffAvatarDialog` header / overlay preview | [x] |

### 2.16 Admin catalog — Excel (A-08)

Reference Web: `excelRegistry.js` · `excelImport.js` · `useExcelRegistryActions.js` · `ExcelTaskMenu.jsx`. **Client-side only** — không API Excel backend.

| Mục | Quy tắc |
|-----|---------|
| Thư viện | **ClosedXML** trong `BV87.Core` |
| UI | `ExcelTaskMenu` trên **PageHeader ngay sau nút Thêm** (Đơn vị: sau **Thêm đơn vị**) — dropdown: **Excel mẫu** · **Import Excel** · **Xuất Excel** — **cấm** Excel trên filter card (D-UI.41) |
| Import | Header **khớp chính xác** mẫu (case-insensitive trim); **create-only** qua `POST` CRUD; row-by-row; partial success message parity Web |
| Export | Xuất **danh sách đã lọc** (client filter hiện tại), không chỉ trang hiện tại |
| Chuỗi UI | `ExcelUiStrings` — mirror `ADMIN_UI.excel` |
| Lưu file (mẫu + xuất) | **Bắt buộc** dùng shared `ExcelSaveHelper` (§2.16.3) — **cấm** gọi `SaveFileDialog` + ghi file rời từng màn |

#### 2.16.3 Post-download UX — lưu Excel về máy (shared)

**Phạm vi:** mọi tác vụ **Excel mẫu** và **Xuất Excel** trên desktop (A-08.x và màn Excel sau này).

| Mục | Quy tắc |
|-----|---------|
| Helper | `BV87.App.Helpers.ExcelSaveHelper` — một entry point cho template + export |
| Save dialog | `SaveFileDialog` · filter `Excel (*.xlsx)|*.xlsx` · `FileName` = tên mặc định từ registry |
| Sau ghi file OK | `MessageBox` **Information** · **Yes/No**: báo **đã lưu thành công** (kèm tên file) · hỏi **«Bạn có muốn mở file không?»** |
| Yes | `Process.Start` + `UseShellExecute = true` để mở bằng app mặc định (Excel) |
| No | Đóng dialog — không mở file |
| Ghi file lỗi | `MessageBox` **Error** — message **tiếng Việt** qua `ExcelSaveHelper.ResolveDownloadErrorMessage` |
| File đang mở (lock) | `IOException` / sharing violation → `ExcelUiStrings.DownloadFileLocked` · gợi ý đóng Excel hoặc đổi tên/vị trí lưu |
| Lỗi ghi khác | `ExcelUiStrings.DownloadFail` — **cấm** hiển thị raw exception tiếng Anh |
| Mở file lỗi | `MessageBox` **Warning** — file đã lưu nhưng không mở được |
| Import Excel | **Không** áp dụng luồng này (chỉ chọn file để đọc) |
| Chuỗi UI | `DownloadSuccessTitle` · `DownloadSuccessMessage` · `DownloadFail` · `DownloadFileLocked` · `OpenFileFail` |
| Import runner | `ExcelImportRunner` (Core) — shared read → map → create-only loop; **cấm** duplicate logic import từng VM |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| A-08.0 | Shared post-download UX — `ExcelSaveHelper` + strings (§2.16.3) | [x] |
| A-08.0.1 | Shared import runner — `ExcelImportRunner` + generic map result (§2.16) | [x] |

#### 2.16.1 Cấp bậc & Chức vụ (A-08.1)

| | Cấp bậc | Chức vụ |
|---|---------|---------|
| Sheet | `Cấp bậc` | `Chức vụ` |
| Template file | `mau-cap-bac.xlsx` | `mau-chuc-vu.xlsx` |
| Export file | `cap-bac.xlsx` | `chuc-vu.xlsx` |
| Template columns | Tên cấp bậc · Thứ tự sắp xếp · Trạng thái sử dụng | Tên chức vụ · Thứ tự sắp xếp · Trạng thái sử dụng |
| Export columns | MÃ · TÊN · THỨ TỰ · NHÂN VIÊN · TRẠNG THÁI | (giống) |
| API import | `POST /api/admin/staff-ranks` | `POST /api/admin/staff-positions` |
| Màn WPF | `StaffAttributeCatalogPage` (`ranks` / `positions`) | (shared) |

#### 2.16.4 Trạng thái chấm công (A-08.2)

| | Giá trị |
|---|--------|
| Sheet | `Trạng thái làm việc` |
| Template file | `mau-trang-thai-lam-viec.xlsx` |
| Export file | `trang-thai-lam-viec.xlsx` |
| Template columns | Mã trạng thái · Tên hiển thị · Nhãn badge · Màu hiển thị · Biểu tượng · Thứ tự sắp xếp · Trạng thái sử dụng |
| Export columns | MÃ · TÊN HIỂN THỊ · NHÃN BADGE · THỨ TỰ · SỬ DỤNG · TRẠNG THÁI |
| Import defaults | `manualAllowed=true` · `groupParent=false` · `parentCode=""` (template không có 3 cột này — parity Web) |
| Validate import | `colorKey` / `iconKey` ∈ `StatusCatalogOptions` |
| API import | `POST /api/admin/attendance-status-types` |
| Màn WPF | `AttendanceStatusCatalogPage` |
| Core | `StatusCatalogExcelRegistry` · `StatusCatalogExcelImportMapper` |

#### 2.16.5 Đơn vị (A-08.3)

| | Giá trị |
|---|--------|
| Sheet | `Đơn vị` |
| Template file | `mau-phong-ban-khoa.xlsx` |
| Export file | `phong-ban-khoa.xlsx` |
| Template columns | **Tên nhóm** · **Tên Đơn vị** · **Tên Trưởng đơn vị** — `ExcelImportHeaders.Department` (khớp Web `admin.js` form.*) |
| Export columns | KHỐI · TÊN ĐƠN VỊ · Trưởng đơn vị · QUÂN SỐ |
| Export head cell | Có trưởng + cấp bậc → `"Họ tên\nCấp bậc"` (newline); không có → `—` |
| Import context | Danh sách nhóm (`_groups`) + staff (`ListStaffPageAsync` pageSize 500) trước khi map |
| Match nhóm | So khớp tên nhóm `vi-VN` case-insensitive (parity Web `localeCompare`) |
| Trưởng đơn vị | Optional — match `fullname` case-insensitive trong staff list |
| API import | `POST /api/admin/departments` |
| Màn WPF | `DepartmentCatalogPage` |
| Core | `DepartmentExcelRegistry` · `DepartmentExcelImportMapper` · `ExcelImportHeaders` |

#### 2.16.6 Nhân viên (A-08.4)

| | Giá trị |
|---|--------|
| Sheet | `Nhân viên` |
| Template file | `mau-nhan-vien.xlsx` |
| Export file | `nhan-vien.xlsx` |
| Template columns | **Mã Đơn vị** · **Họ và tên** · **Cấp bậc** · **Chức vụ** · **Trạng thái** — `ExcelImportHeaders.Staff` (khớp Web `admin.js` form.*; **không** dùng nhãn form WPF `FormDept`) |
| Export columns | MÃ NV · ĐƠN VỊ (`{unitCode} - {tên}` — D-UI.44) · HỌ TÊN · CẤP BẬC · CHỨC VỤ · TRẠNG THÁI |
| Export đơn vị | `{unitCode} - {tên}` khi có ký hiệu; không `unitCode` thì chỉ tên (D-UI.44) — **cấm** `[01] tên` |
| Export cấp bậc/chức vụ | `—` nếu null/empty |
| Export trạng thái | `Đang hoạt động` / `Ngưng hoạt động` |
| Export phạm vi | **Toàn bộ kết quả lọc hiện tại** — gọi `ListStaffPageAsync` lặp page (pageSize 500) đến hết `totalPages` (server-side pagination) |
| Import context | `_departments` · `_rankNames` · `_positionNames` (đã load trong VM) |
| Validate import | Mã đơn vị tồn tại trong danh sách đơn vị; cấp bậc/chức vụ optional — nếu catalog có dữ liệu thì phải khớp tên chính xác |
| Trạng thái import | `ExcelActiveStatusParser` (parity Web `parseActiveStatus`) |
| API import | `POST /api/admin/staff` (create-only) |
| Màn WPF | `StaffCatalogPage` |
| Core | `StaffExcelRegistry` · `StaffExcelImportMapper` · `ExcelImportHeaders.Staff` |

#### 2.16.2 Checklist ticket

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| A-08.1 | Excel Cấp bậc + Chức vụ (§2.16.1) | [x] |
| A-08.2 | Excel Trạng thái chấm công (§2.16.4) | [x] |
| A-08.3 | Excel Đơn vị (§2.16.5) | [x] |
| A-08.4 | Excel Nhân viên (§2.16.6) | [x] |

### 2.17 Admin utilities — Tiện ích (A-05)

Reference Web: `UnlockRequestsPage.jsx` · `ReminderHistoryPage.jsx` · `AttendanceAuditLogPage.jsx` · `SPEC_ADMIN.md` §2.2 · §6.3 · §4.7.x.

| Nav id | View WPF | Web tab |
|--------|----------|---------|
| `unlock-requests` | `UnlockRequestsPage` | `utilities-unlock-requests` |
| `reminder-history` | `ReminderHistoryPage` | `utilities-reminder-history` |
| `audit-logs` | `AttendanceAuditLogPage` | `utilities-attendance-audit` |

Shared: `UtilitiesUiStrings` · `AdminUtilitiesFormatHelper` (datetime `dd/MM/yyyy HH:mm`, IP, default date range) · `AdminApiClient` utilities endpoints.

#### 2.17.0 Shared (A-05.0)

| Mục | Quy tắc |
|-----|---------|
| Default date range | Đầu tháng hiện tại → hôm nay (`AdminUtilitiesFormatHelper.DefaultHistoryRange`) |
| Datetime cột log | `dd/MM/yyyy HH:mm AM\|PM` (D-UI.54) — empty → `—` · **cấm** 12h `hh:mm` |
| IP audit | IPv4 rút gọn parity Web `displayIp` |
| Filter card | Combo đơn vị (Tất cả + departments) · DatePicker from/to · Combo **Loại gửi** (chỉ reminder — D-UI.51) · **Tìm kiếm** · **Xóa lọc** · **Làm mới** (reminder + audit + fingerprint history) — §2.17.8 |
| Validate range | `from > to` → «Từ ngày không được lớn hơn đến ngày.» |
| Out of scope | Mobile layout · badge nav pending-count · breadcrumb Web |

#### 2.17.1 Yêu cầu mở khóa (A-05.1)

| Mục | Quy tắc |
|-----|---------|
| API | `GET /attendance/unlock-requests?status=` · `POST .../{id}/approve` · `POST .../{id}/reject` `{ note? }` |
| Filter | Combo **Trạng thái** (draft) + **Tìm kiếm** + **Làm mới** — PENDING mặc định · **cấm** reload khi đổi Combo (D-UI.48) |
| Bảng | STT · NGÀY CHẤM CÔNG **210** · ĐƠN VỊ · TRƯỞNG ĐƠN VỊ · LÝ DO `*` MinWidth **120** MaxWidth **220** · TRẠNG THÁI (badge) · GỬI LÚC **210** · THAO TÁC **120** — D-UI.58 |
| THAO TÁC | Nút **«Thao tác»** → `ContextMenu` **Xác nhận** · **Từ chối** (Từ chối `DangerFgBrush`) khi `PENDING` — D-UI.46 · **cấm** 2 nút ngang · **cấm** `HorizontalAlignment=Right` |
| Phân trang | Client `TablePaginationBar` (§2.10) · `UnitLabel` = `yêu cầu` · default page size **20** · slice sau filter trạng thái |
| Layout card | Một card: header · filter · `DataGrid` · footer `TablePaginationBar` (parity `DepartmentCatalogPage`) |
| Flash | Approve/Reject message parity `ADMIN_UI.dashboard` |

#### 2.17.2 Lịch sử nhắc nhở (A-05.2)

| Mục | Quy tắc |
|-----|---------|
| API | `GET /attendance/reminder-history?from=&to=` → `{ history, stats }` |
| Filter | Đơn vị + khoảng **Ngày Chấm công** + Combo **Loại gửi** (Tất cả / Tự động / Thủ công) · dept + loại **client-side** trên `history` · Combo draft đến **Tìm kiếm** (D-UI.48 / D-UI.51) |
| Stats (Desktop) | **Không hiển thị** trên WPF — xem §2.17.9 · Web vẫn chart thống kê |
| Bảng CHI TIẾT | NGÀY CHẤM CÔNG · ĐƠN VỊ · LOẠI (AUTO/MANUAL badge) · THỜI GIAN GỬI Width **220** (D-UI.57) |
| Phân trang | Client `TablePaginationBar` · `UnitLabel` = `lần nhắc` |
| Xuất Excel | `ExcelSaveHelper` · file `lich-su-nhac-nho_{from}_{to}.xlsx` · sheet «Lịch sử nhắc nhở» · toàn bộ **kết quả lọc** (đơn vị + loại), không chỉ trang hiện tại |

#### 2.17.3 Nhật ký chỉnh sửa (A-05.3)

| Mục | Quy tắc |
|-----|---------|
| API | `GET /attendance/audit-logs?from&to&deptCode&page&pageSize` — **server pagination** |
| Filter label range | **Thời gian thao tác** (khác reminder) |
| Bảng | THỜI GIAN Width **200** · TÀI KHOẢN · ĐƠN VỊ Width **150** (D-UI.58) · NHÂN VIÊN · NGÀY CHẤM CÔNG Width **200** · HÀNH ĐỘNG · IP — D-UI.57 đủ header IN HOA + datetime `dd/MM/yyyy HH:mm AM` |
| Phân trang | `TablePaginationBar` · `UnitLabel` = `thao tác` · reload API khi đổi trang/size |

#### 2.17.5 Lịch sử vân tay (A-05.4 / P2.4)

| Mục | Quy tắc |
|-----|---------|
| Nav | `fingerprint-history` — nhóm **Tiện ích** (ADMIN only) |
| View | `FingerprintHistoryPage` |
| API | `GET /api/admin/fingerprints/audit-logs?from&to&deptCode&page&pageSize` — **server pagination** |
| Filter | ComboBox đơn vị + khoảng **Thời gian thao tác** (parity §2.17.3) |
| Bảng | **STT** · THỜI GIAN Width **200** (D-UI.58) · HÀNH ĐỘNG · NHÂN VIÊN · ĐƠN VỊ · THỰC HIỆN · GHI CHÚ NGÓN · IP — **cấm** in-card «CHI TIẾT» (D-UI.46) |
| Cột IP (D-UI.55) | IPv4 **máy thực hiện** (vd. `192.170.180.23`) — WPF gửi header `X-Client-Ip` = LAN IPv4 (`ClientMachineInfo`); BE `RequestClientInfo` ưu tiên header nếu IPv4 hợp lệ. `::1` / IPv6 loopback → hiện `127.0.0.1`. **Cấm** hiện `::1` thô |
| Phân trang | `TablePaginationBar` · `UnitLabel` = `thao tác` |

#### 2.17.6 HEAD — Nhân viên / vân tay (H-06 / P2.4)

| Mục | Quy tắc |
|-----|---------|
| Nav | `staff` — mode HEAD |
| View | `HeadStaffFingerprintPage` |
| PageHeader | Chỉ `PageTitle` — **cấm** subtitle (D-UI.36) |
| API | `GET /api/head/fingerprints` · `DELETE /api/head/fingerprints/{empCode}` |
| Bảng | STT · **ẢNH ĐẠI DIỆN** 140 · MÃ NV · HỌ TÊN **220** · VÂN TAY `*` MinWidth **280** · THAO TÁC **120** — nút **«Thao tác»** → `ContextMenu` (**Ảnh đại diện** · **Xóa vân tay** disabled nếu chưa ĐK) · **cấm** 2 nút ngang |
| Avatar | `StaffAvatarDialog` §2.15.3 — `PATCH /api/head/staff/{empCode}/avatar` (D-STAFF.1); `GET /api/head/staff` để preload `avatarUrl` |
| Enroll lại | Hướng dẫn NV đăng ký lại qua WPF **Tiện ích → Đăng ký vân tay** (§2.17.7) sau khi xóa |

#### 2.17.7 Đăng ký vân tay (D1.1 — WPF enroll)

| Mục | Quy tắc |
|-----|---------|
| Nav id | `fingerprint-enroll` — nhóm **Tiện ích** (ADMIN + HEAD) |
| View | `FingerprintEnrollPage` |
| PageHeader HEAD (D-UI.37 / D-UI.43) | Chỉ `PageTitle` — **cấm** `PageSubtitle` (ADMIN **cũng** cấm — D-UI.43) |
| Auth | JWT session — **không** kiosk token; **không** PIN enroll Agent |
| Thiết bị | USB ZK9500 — **`lib\libzkfp.dll`** + **`lib\libzkfpcsharp.dll`** (wrapper C# chính thức) → copy build ra **`lib\` cạnh exe**; fallback System32 nếu thiếu (dev) |
| Native load (D1.1l) | Trước SDK: `SetDllDirectory(lib\)` + load **`libzkfp.dll`**; gọi API qua **`libzkfpcsharp.zkfp2`** |
| ADMIN API | `GET /api/admin/fingerprints?deptCode=` · `POST /api/admin/fingerprints/enroll` |
| HEAD API | `GET /api/head/fingerprints` · `POST /api/head/fingerprints/enroll` (khoa mình) |
| Luồng | Chọn NV → **Bắt đầu đăng ký** (confirm ghi đè nếu đã ĐK) → quét **3 lần** → dialog **`fingerLabel`** → POST → reload |
| Preview gate | **Không** vẽ preview / không tính bước quét cho đến khi bấm **Bắt đầu đăng ký** (parity §9.1 P1.1i) |
| Filter NV | Tất cả (**mặc định**) · Chưa đăng ký · Đã đăng ký — **draft** đến khi bấm **Tìm kiếm** (D-UI.48) · **cấm** tự lọc khi đổi ComboBox |
| Tìm kiếm NV (D1.1aa / D-UI.46 / D-UI.47) | Ô **Họ tên / Mã NV** Width **360** (full `SearchPlaceholder`) · **Tìm kiếm** · **Xóa lọc** (sau Tìm kiếm) · **Làm mới** = gọi lại API + giữ bộ lọc đã áp dụng |
| ~~Stats (D1.1y)~~ | ~~Tổng / Đã ĐK / Chưa ĐK~~ — **gỡ** dòng summary trên danh sách (D1.1y) |
| Phân trang (D1.1y) | `TablePaginationBar` §2.10 — client-side slice sau filter; `UnitLabel` = `nhân viên`; default `PageSize` **20** |
| Xóa vân tay | **Không** trên màn này — dùng Danh mục NV (Admin) hoặc Nhân viên (HEAD) |
| STT (D1.1w) | `(CurrentPage - 1) × PageSize + index + 1` trên trang hiện tại (§2.8.1) |
| Binding UI | Property VM chỉ đọc (vd. `EnrollStep`) bind qua `<Run Text="…">` **bắt buộc** `Mode=OneWay` — WPF mặc định TwoWay trên `Run.Text` gây crash khi mở page (D1.1a) |
| Tiến độ quét | ~~Footer preview «Lần quét»~~ → badge «ĐANG QUÉT (n/3)» panel USB + banner hướng dẫn (D1.1e) |
| Toolbar (D1.1b) | ~~Gom 4 nút một hàng~~ → tách lọc NV / làm mới danh sách / USB (D1.1e) |
| Banner (D1.1b) | Một banner semantic (`BannerMessage` + `BannerTone`: Info / Success / Warning / Danger) — token `ThemeResources` — parity Agent §9.1 P1.1k |
| Nút Bắt đầu (D1.1b) | `IsEnabled` khi máy đã mở + đã chọn NV + không đang enroll; tooltip khi disabled; confirm ghi đè (R1) trước khi `registering=true` |
| Filter chip (D1.1b) | Tất cả · Chưa ĐK · Đã ĐK — highlight chip đang chọn (`PrimaryLight` + viền `Primary`) |
| Thông báo (D1.1b) | Ngắn gọn VN: chưa kết nối / quét n/3 / ngón khác / merge fail / hủy label / POST OK (`MessageBox` + banner) / lỗi API |
| Khóa form (D1.1b) | Khi `IsRegistering`: disable toolbar + combo NV + filter chip; **Hủy** enable |
| Auto-connect (D1.1c) | Khi mở page: tự `Connect()` trên worker, retry tối đa **5** lần (400ms lần đầu, 800ms các lần sau) — parity Agent `scheduleAutoOpenDevice` |
| Hot-plug (D1.1c) | Poll mỗi **2.5s** khi chưa kết nối + không đang enroll → thử connect; user **không** bắt buộc bấm «Kết nối» nếu USB sẵn sàng |
| Template buffer (D1.1c) | Mọi mẫu SDK **2048 byte** cố định trước `DBMatch` / `DBMerge` — parity Agent Java |
| UI thread (D1.1c) | Cập nhật `EnrollStep` / banner trong vòng quét qua `Dispatcher` |
| SdkThread (D1.1p) | **100%** lệnh `libzkfp` trên **`ZkFingerprintSdkThread`** (gồm `DBMatch`/`DBMerge`) — P/Invoke **cấm** gọi từ UI thread (tránh crash native lần 2) |
| onExtractOk (D1.1p) | `Acquire` OK → **`ProcessExtractOnSdk` đồng bộ trên SdkThread** → `PostUiEvent`/`BeginInvoke` UI chỉ preview/banner |
| Template clone (D1.1p) | Trước `Acquire`: `Array.Clear` buffer 2048; sau OK **`BlockCopy` cả 2048 byte** — parity Agent `template.clone()` / `arraycopy(…,2048)` |
| SDK wrapper (D1.1q) | **`libzkfpcsharp.dll`** (official C#) cho `Acquire`/`DBMatch`/`DBMerge` — không P/Invoke thô `libzkfp` (tránh `DBMatch` mã **-5** INVALID_PARAM) |
| DBMatch order (D1.1q) | `DBMatch(db, mẫu_mới, mẫu_đã_lưu)` — parity C# ZKFinger demo |
| Enroll poll (D1.1m) | Sleep **500ms** sau mỗi vòng poll khi đã kết nối — parity ZKFPDemo `Thread.sleep(500)` |
| Finger-lift (D1.1j) | **Không** gate nhấc ngón |
| UI callback (D1.1m) | `PostUiEvent` → `Dispatcher.BeginInvoke` — clone ảnh/template trước khi post |
| Hủy enroll (D1.1j) | `registering=false` + hoàn thành TCS — **không** dừng SdkThread; `CancelEnroll` không block UI |
| Native load (D1.1l) | Bundled `lib\` + `SetDllDirectory` + `PlatformTarget=x64` |
| Debug UI (D1.1r) | **Không** panel «Nhật ký chẩn đoán SDK» trên màn enroll — đã verify production (D1.1q) |
| Probe SDK (D1.1d) | **Không** gọi `Init`/`Terminate` probe khi đã có session mở — tránh corrupt SDK giữa chừng enroll |
| Tiến độ quét (D1.1e) | **Một** counter `EnrollStep` = số lần **đã quét xong** (0–3), parity Agent `enrollIdx` — **bỏ** footer «Lần quét» trùng banner |
| Badge quét (D1.1e) | Panel phải (cạnh trạng thái USB): «ĐANG QUÉT ({n}/3)» khi `IsRegistering` — parity Agent `styleScanBadge` |
| Trạng thái USB (D1.1z) | «Đã kết nối» / «Chưa kết nối» — chữ **`FontSizeLg`** · dot 8px · màu semantic success/danger |
| Hint preview (D-UI.47) | «Chờ đặt ngón tay…» (`PreviewWaiting`) — **`FontSizeXl`** SemiBold `ContentMutedBrush` khi chưa có ảnh quét · **cấm** inherit `FontSizeBase` |
| Banner enroll (D1.1e) | Chỉ **hướng dẫn hành động**: quét tiếp «({n}/3)» dùng **đã quét** · ghép mẫu · dialog label · lưu API |
| ~~Finger-lift gate (D1.1d–g)~~ | Gỡ (D1.1j) — Agent không có lift gate |
| Chưa đủ 3 lần (D1.1e) | Thoát enroll `< 3` mẫu (hủy) → banner WARNING «Chưa đủ 3 lần quét…» |
| Layout toolbar (D1.1s) | **3 card:** (1) Bộ lọc · (2) Danh sách NV (`DataGrid` — D1.1w) · (3) USB + preview + **Bắt đầu/Hủy** |
| Tìm kiếm (D1.1s / D-UI.48) | **Tìm kiếm** = API (Admin: đơn vị) + lọc trạng thái + họ tên/mã NV · **Làm mới** = API lại + **giữ** bộ lọc đã áp dụng · **cấm** lọc khi đổi Combo trạng thái |
| HEAD layout (D1.1s) | Nhóm 1 không có lọc đơn vị — **bộ lọc căn trái** (trạng thái đăng ký + Tìm kiếm + Làm mới); **không** giữ cột Grid trống cho lọc đơn vị ẩn |
| ~~Layout toolbar (D1.1e)~~ | Thay bằng D1.1s (3 nhóm) |
| Lỗi API (D1.1e) | Banner Danger + `MessageBox` «Đăng ký thất bại» — parity Agent enroll fail dialog |
| Âm thanh (D1.1t) | Phản hồi âm thanh khi banner **Success / Warning / Danger** trên màn enroll — **không** kêu banner **Info** (quét 1/3, 2/3, đang ghép) |
| Success sound (D1.1t) | POST enroll OK → `scan-success.wav` (parity Agent §9.3.1) |
| Fail sound (D1.1t) | Merge fail, SDK lỗi, API fail, `EnrollFailed` → `scan-fail.wav` |
| Warning sound (D1.1t) | Ngón trùng, chưa đủ 3 lần, hủy label, chặn bắt đầu, auto-connect fail → `SystemSounds.Exclamation` (2 nhịp ngắn fallback) |
| Sound thread (D1.1t) | Phát async background — **không** block UI / SdkThread; `DesktopSoundService` |
| Sound assets (D1.1t) | `Assets/Sounds/scan-success.wav`, `scan-fail.wav` — embedded resource; fallback PCM/`SystemSounds` |
| Danh sách NV (D1.1w) | **Đổi** `ListBox` → **`DataGrid`** read-only (`AdminDataGridStyle`); header: **STT** · **Mã NV** · **Họ tên** · **Trạng thái đăng ký** |
| Cột cell (D1.1ab / D-UI.53) | **STT** `DataGridSttColumnWidth` + `DataGridSttCellStyle` · **Mã NV** 96 + **Họ tên** **220** · cell `AdminDataGridTextCellStyle` — **cấm** `PrimaryBrush` / `SemiBold` trên mã / tên · **cấm** Họ tên `Width=*` |
| Cột trạng thái (D1.1ab) | Width `*` MinWidth **220** — badge + `TextTrimming` · **cấm** Họ tên `Width=*` chiếm chỗ trạng thái |
| Tooltip (D1.1ab) | Mọi ô trim `…` (Họ tên · Trạng thái đăng ký · Mã NV nếu cắt) — `ToolTip` = full text · **cấm** cắt không tooltip |
| STT (D1.1w) | `(CurrentPage - 1) × PageSize + index + 1` — §2.8.1 · §2.10 |
| Trạng thái cột (D1.1w) | `RegistrationStatusLabel`; nếu đã ĐK + có `fingerLabel` → «Đã đăng ký ({fingerLabel})» — badge semantic |
| Chọn dòng (D1.1w) | `SelectedItem` → `SelectedStaff` — **giữ** luồng enroll |
| Layout list (D1.1y) | Card danh sách: tiêu đề · `DataGrid` · footer `TablePaginationBar` — **cấm** dòng Tổng/Đã ĐK/Chưa ĐK |
| USB cùng máy kiosk (D1.2d) | ZK SDK: **một** process `Init` + `OpenDevice(0)`. Fail `Connect` **và** có agent (mutex `Local\BV87.WpfAgent.Running` **hoặc** cmdline `--agent`) **và** agent **không** nhường được (timeout IPC / agent cũ) → banner `DeviceHeldByKiosk` — **cấm** «kiểm tra cáp». `DllNotFoundException` giữ nguyên. **Cấm** `taskkill` agent. |
| Nhường USB (D1.2e) | Cùng PC: mở **Đăng ký vân tay** → enroll giữ mutex `Local\BV87.Enroll.UsbLease` → agent `Disconnect` + set event `Local\BV87.Usb.AgentYielded` + banner `UsbPausedForEnroll` → enroll `OpenDevice`. Rời trang / đóng shell → enroll `Disconnect` rồi thả lease → agent `Connect` + nạp mẫu lại. Watchdog **chỉ** restart khi **không còn** `BV87.exe --agent` — **cấm** hiểu disconnect USB là chết process. **Cấm** kill agent. HEAD **không** phải đóng cửa sổ kiosk. |

##### 2.17.7.1 Kiến trúc kỹ thuật SDK (verified — D1.1q / D1.1r)

Màn **Đăng ký vân tay** WPF đã chạy end-to-end: quét 3 lần → `DBMerge` → dialog `fingerLabel` → POST API → reload danh sách.

**Runtime & DLL**

| Thành phần | Chi tiết |
|------------|----------|
| Platform | `x64` · .NET 8 WPF |
| Native | `libzkfp.dll` (driver ZKFinger / System32) |
| Wrapper | `libzkfpcsharp.dll` → class `libzkfpcsharp.zkfp2` — **bắt buộc** cho `Acquire` / `DBMatch` / `DBMerge` (P/Invoke thô gây `DBMatch` mã **-5** INVALID_PARAM) |
| Bootstrap | `ZkNativeLibraryBootstrap`: `SetDllDirectory({exe}\lib)` trước `NativeLibrary.Load` |

**Luồng enroll (3 lần quét)**

```
[UI thread]  Chọn NV → Bắt đầu đăng ký → await BeginEnrollAsync
                    ↑ PostUiEvent (BeginInvoke): preview, banner, EnrollStep
                    |
[ZkFingerprintSdkThread]
  loop 500ms:
    AcquireFingerprint(dev, img[width×height], template[2048], ref len)
    → ret=0 → ProcessExtractOnSdk (sync trên SdkThread):
         idx>0: DBMatch(db, mẫu_mới, mẫu_đã_lưu) — score >= 0 mới chấp nhận
         lưu template 2048 byte vào regTempArray[idx]
         idx==3: DBMerge → base64 → CompleteEnroll → UI dialog fingerLabel → POST
```

**Quy tắc template (parity Agent Java + C# demo)**

| Bước | Quy tắc |
|------|---------|
| Trước `Acquire` | `Array.Clear` buffer template 2048; `cbTemplate = 2048` |
| Sau `Acquire` OK | `BlockCopy` **cả 2048 byte** vào bản clone (`template.clone()` / `CapTmp`) |
| Buffer ảnh | Đúng `width × height` từ `GetParameters(1/2)` — wrapper C# dùng `imgBuffer.Length` |
| `DBMatch` | Thứ tự C# demo: `(db, mẫu_vừa_quét, mẫu_lần_trước)`; `<= 0` = không khớp; `-5` = lỗi tham số SDK |

**Threading & deadlock (D1.1n–p)**

| Thành phần | Thread |
|------------|--------|
| `Init` / `OpenDevice` / `Acquire` / `DBMatch` / `DBMerge` / `Close` | **Chỉ** `ZkFingerprintSdkThread` |
| Preview / banner / `EnrollStep` | UI — `Dispatcher.BeginInvoke` (**không** `Invoke` từ SdkThread khi cập nhật UI song song) |
| `BeginEnrollAsync` | `EnqueueOnSdkThread` — **không** block UI (`RunOnSdkThread` + `Wait`) |

**Mã lỗi SDK thường gặp**

| Mã | Ý nghĩa | UI |
|----|---------|-----|
| `0` | OK | — |
| `-8` | Không có ngón / chưa capture (`ZKFP_ERR_CAPTURE`) | Im lặng — poll tiếp |
| `-5` | Tham số không hợp lệ (`ZKFP_ERR_INVALID_PARAM`) | Banner Danger — ngắt kết nối, thử lại |
| `DBMatch <= 0` (khác -5) | Ngón không khớp lần trước | Banner Warning + gợi ý nhấc ngón |

**Class map (desktop)**

| File | Vai trò |
|------|---------|
| `Hardware/ZkNative.cs` | Facade `zkfp2.*` |
| `Hardware/ZkFingerprintDevice.cs` | SdkThread + enroll state machine |
| `Hardware/ZkNativeLibraryBootstrap.cs` | Load `lib\` |
| `ViewModels/Utilities/FingerprintEnrollViewModel.cs` | UI state, API POST |
| `Views/Admin/Utilities/FingerprintEnrollPage.xaml` | Layout 2 cột NV + preview |
| `BV87.Core/Helpers/WpfUsbShare.cs` | D1.2e — lease mutex + event nhường USB (cùng máy agent) |

#### 2.17.8 Admin Tiện ích — UI parity dashboard & catalog (D-UI.12)

Parity §2.11.4 / §2.11.5 / §2.14.3 / §2.10 — nhóm **Tiện ích** ADMIN.

| Mục | Quy tắc |
|-----|---------|
| Phạm vi | `UnlockRequestsPage` · `ReminderHistoryPage` · `AttendanceAuditLogPage` · `FingerprintHistoryPage` · `FingerprintEnrollPage` (filter + bảng NV) |
| Label filter | **`FilterToolbarLabelStyle`** — cấm inline `FontSize="13"` |
| DatePicker | **`FilterDatePickerStyle`** — text căn giữa (§2.11.5) |
| Nút filter | **`FilterToolbarPrimaryButtonStyle`** / **`FilterToolbarSecondaryButtonStyle`** |
| Làm mới | Trong **filter card** — icon `&#xE72C;` + spin `IsRefreshing` · **cấm** Làm mới ở `PageHeader` (trừ Reminder: giữ **Xuất Excel** header) |
| Filter date-range | `[Lọc đơn vị · Combo 220] · [Label khoảng · From 140] → [To 140] · [Tìm kiếm] [Xóa lọc] [Làm mới]` — **cấm** cột `*` giữa controls |
| Reminder filter | Thêm `[Loại gửi · Combo 140]` sau To, trước **Tìm kiếm** (D-UI.51) |
| Unlock filter | Card filter **tách** khỏi card bảng · `[Trạng thái · Combo 220] · [Làm mới]` |
| Tiêu đề bảng | **`SectionTitleStyle`** — cấm `FontSize="11"` muted |
| Header cột | `{x:Static utilities:UtilitiesUiStrings+…}` · **`AdminDataGridColumnHeaderCatalogStyle`** từng cột — cấm `{Binding}` header (§2.14.3) |
| Unlock LÝ DO | Header bắt buộc `ColReason` |
| DataGrid | `HorizontalScrollBarVisibility="Auto"` · `MinWidth="860"` khi nhiều cột |
| Phân trang | Giữ `TablePaginationBar` §2.10 — không đổi VM |
| Enroll filter | `WrapPanel` → **Grid 1 hàng** · label `FilterToolbarLabelStyle` · header catalog parity cột NV |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.12a | SPEC §2.17.8 | [x] |
| D-UI.12b | `UtilitiesUiStrings` shared filter labels | [x] |
| D-UI.12c | Audit + Fingerprint history + Reminder — filter + DatePicker | [x] |
| D-UI.12d | `UnlockRequestsPage` — filter card + headers | [x] |
| D-UI.12e | Utilities list grids — `x:Static` header + catalog header style | [x] |
| D-UI.12f | `FingerprintEnrollPage` — filter grid + header parity | [x] |

#### 2.17.9 Lịch sử nhắc nhở — bỏ khối thống kê Desktop (D-UI.13)

| Mục | Quy tắc |
|-----|---------|
| Phạm vi | **Desktop WPF** `ReminderHistoryPage` — **Web** giữ `ReminderDeptStatsChart` |
| Gỡ UI | **Cấm** card «Thống kê theo ĐƠN VỊ» · Top 10 · tổng lần nhắc · `StatRows` DataGrid |
| Layout | Parity §2.17.8 / `AttendanceAuditLogPage`: **PageHeader** (Xuất Excel) → **Error** → **Filter card** → **Table card** (`Height="*"`) |
| API | Vẫn `GET …/reminder-history` → `{ history, stats }` — Desktop **chỉ dùng `history`** |
| VM | Xóa bind/UI stats (`StatRows`, `RebuildStats`, `HasStats`, …) |
| Strings | `StatsTitle` / `StatsCol*` giữ trong `UtilitiesUiStrings` cho Web |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.13a | SPEC §2.17.9 | [x] |
| D-UI.13b | `ReminderHistoryPage.xaml` — layout 4 hàng | [x] |
| D-UI.13c | `ReminderHistoryViewModel` — gỡ stats | [x] |

#### 2.17.4 Checklist A-05

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| A-05.0 | Shared API + strings + helpers (§2.17.0) | [x] |
| A-05.1 | Yêu cầu mở khóa (§2.17.1) | [x] |
| A-05.2 | Lịch sử nhắc nhở (§2.17.2) | [x] |
| A-05.3 | Nhật ký chỉnh sửa (§2.17.3) | [x] |
| A-05.4 | Lịch sử vân tay + xóa VT Admin/HEAD (§2.17.5–§2.17.6) | [x] |
| D-UI.55 | Lịch sử vân tay — cột IP = IPv4 máy thực hiện (§2.17.5) | [x] |
| D1.1 | Đăng ký vân tay WPF + bỏ kiosk login (§2.17.7) | [x] |
| D1.1a | Fix binding `EnrollStep` — `Run` + `Mode=OneWay` (§2.17.7) | [x] |
| D1.1b | Enroll UX: toolbar gom nút, banner tone, disable Bắt đầu, feedback VN (§2.17.7) | [x] |
| D1.1c | Fix crash quét 2/3 (buffer 2048) + auto-connect USB (§2.17.7) | [x] |
| D1.1d | Finger-lift gate + capture thread + pinned DBMatch (§2.17.7) | [x] |
| D1.1e | UX: layout toolbar, progress thống nhất, feedback enroll đầy đủ (§2.17.7) | [x] |
| D1.1f | Fix crash quét 2/3: single SDK thread, bỏ finger-lift gate (§2.17.7) | [x] |
| D1.1g | Fix crash quét 2/3: Agent split capture/UI + lift debounce trước DBMatch (§2.17.7) | [x] |
| D1.1h | Pause SDK 600ms sau mỗi lần quét OK + rebuild sạch (§2.17.7) | [x] |
| D1.1i | Sequential SDK worker: Acquire→DBMatch→UI sync→next poll (§2.17.7) | [x] |
| D1.1j | Persistent WorkThread + bỏ lift gate + BeginInvoke UI (§2.17.7) | [x] |
| D1.1k | Split Acquire (WorkThread) / DBMatch+Merge (UI thread) + cooldown 400ms (§2.17.7) | [x] |
| D1.1l | Bundled `lib\` trong src + `SetDllDirectory` + copy build output (§2.17.7) | [x] |
| D1.1m | SdkThread monopolist: sync onExtractOk + UI clone only + poll 500ms (§2.17.7) | [x] |
| D1.1n | Trace panel UI + file log chẩn đoán crash native (§2.17.7) | [x] |
| D1.1o | Fix quét 2/3: template zero-fill + `DBMatch`/`DBMerge` UI thread (parity Agent) (§2.17.7) | [x] |
| D1.1p | Fix crash/thoát lần 2: `DBMatch`/`DBMerge` lại SdkThread + clone template 2048 byte (§2.17.7) | [x] |
| D1.1q | `libzkfpcsharp` wrapper + thứ tự `DBMatch` C# demo — fix báo sai «ngón khác» (§2.17.7) | [x] |
| D1.1r | Verify enroll E2E + gỡ panel debug; ghi §2.17.7.1 kiến trúc SDK (§2.17.7) | [x] |
| D1.1s | Layout 3 nhóm: bộ lọc / danh sách NV / quét vân tay (§2.17.7) | [x] |
| D1.1t | Enroll sound feedback: success/fail/warning WAV + async service (§2.17.7) | [x] |
| D1.1u | Typography global Times New Roman + scale token (§2.1) | [x] |
| D1.1v | Tăng font size thêm +2pt toàn app (§2.1) | [x] |
| D1.1w | Enroll staff list: DataGrid + header STT/Mã NV/Họ tên/Trạng thái (§2.17.7) | [x] |
| D1.1y | Enroll list: gỡ stats summary + `TablePaginationBar` §2.10 (§2.17.7) | [x] |
| D1.1aa | Enroll filter HEAD: mặc định Tất cả + tìm họ tên/mã NV + auto-lọc trạng thái (§2.17.7) | [x] |
| D1.1ab | Enroll list: cell style parity + tooltip + USB `FontSizeLg` (§2.17.7) | [x] |
| D-UI.47 | Enroll: ô tìm Width 360 + hint preview `FontSizeXl` (§2.7.13 / §2.17.7) | [x] |
| D-UI.53 | Enroll: cột Họ tên Width 220 (§2.7.18 / §2.17.7) | [x] |
| D1.2d | Enroll: khi agent giữ USB — banner kiosk, không «kiểm tra cáp» (§2.17.7 / §2.22) | [x] |
| D1.2e | Agent nhường USB cho enroll cùng PC — IPC lease + banner 2 phía (§2.17.7 / §2.22) | [x] |

### 2.18 Chấm công shared — wizard nghỉ trực & lịch thủ công (D-ATT.1)

Reference Web: `NghiTrucAssignModal.jsx` · `ManualScheduleModal.jsx` · `useAttendancePage.js` · `SPEC_FINGERPRINT.md` §4.13.8 · `SPEC_ADMIN.md` P8-ReassignNghiTruc.

| Mục | Quy tắc |
|-----|---------|
| Wizard | `NghiTrucAssignDialog` — giải trình + chấm nghỉ trực atomic |
| API wizard | `PUT /api/attendance/nghi-truc-assign` — body `NghiTrucAssignRequest` |
| Lịch thủ công | `ManualScheduleDialog` — read-only merged periods — polish §2.18.6 |
| API lịch | `GET /api/attendance/manual-schedule?empCode&from&to` — **cấm** `?status=` |
| Routing quick action | `action.IsPostScanOverride && NeedsNghiTrucWizard(staff)` → wizard; else `ManualRangeDialog` / VE_SOM |
| `ManualRangeDialog` icon | **Window.Icon** = glyph MDL2 `E787` (`DialogWindowIcons` / D-UI.35) — §2.6.1 |
| Wizard điều kiện | `punchCount < 4` (0–3 mốc) — gồm HEAD chấm trước khi NV quét |
| Intent | **`HALF_AFTERNOON`** · **`NGHI_TRUC_FULL`** — **ẩn FULL** khi đã có giờ quét; **cấm** `HALF_MORNING` trên wizard (P16) |
| Roster status | Badge **NGHỈ TRỰC** + subtitle **1 ngày** / **Nửa buổi chiều** (`StaffAttendanceRow.NghiTrucSubtitle`) |
| HALF | Không điền giờ hành chính; NV quét vào sáng + ra trưa; kiosk cấm chiều |
| FULL (D1) | Xóa 4 mốc; không giờ giả; kiosk cấm mọi quét |
| Validation wizard | Lý do bắt buộc; from ≤ to; max **366** ngày |
| Validation lịch | from ≤ to; max **400** ngày; default range today−30 → today+365 |
| Strings | `AttendanceUiStrings.cs` — mirror `UI.nghiTrucWizard*` + `MANUAL_SCHEDULE_UI` |
| Helper | `AttendanceActionHelper` — `NeedsNghiTrucWizard`, `ResolveInitialPayrollIntent`, `GetNghiTrucWizardOptions` |
| Staff row | Map thêm `payrollIntent` từ API |
| Admin menu | Cột THAO TÁC — **Lịch thủ công** luôn hiện (parity Web) |
| HEAD | Quick action wizard từ `HeadAttendanceViewModel`; menu lịch — phase H-02.2 |

#### 2.18.1 Checklist D-ATT.1

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-ATT.1a | Core models + API + helper + strings | [x] |
| D-ATT.1b | `NghiTrucAssignDialog` + wire quick action Admin/HEAD | [x] |
| D-ATT.1d | P16 nghỉ trực: 2 intent, subtitle roster, không nửa buổi sáng | [x] |

#### 2.18.2 Wizard nghỉ trực — layout lớn + toast (D-ATT.2)

Parity Web `FlashBanner` / `useFlashMessage` (4.5s). Binding nghiệp vụ P16 không đổi.

| Mục | Quy tắc |
|-----|---------|
| Window | `NghiTrucAssignDialog` — **960×** auto height; `MinWidth` 880; `MinHeight` 560; `MaxHeight` 90vh; `CenterOwner`; **`Window.Icon`** = glyph `E708` (§2.6.1 / D-UI.35) — **cấm** logo BV · **cấm** icon Windows mặc định |
| Typography | **Chỉ** token `ThemeResources`: title `FontSizeXl` · NV `FontSizeLg` · label `FontSizeMd` SemiBold · input `FontSizeBase` cao **44** · hint `FontSizeSm` — **cấm** hardcode 11/12/13 |
| Header | Icon MDL2 `E708` + title **một lần** trong card (Window.Title giữ cho taskbar); tên NV + mã; **cấm** lặp title chrome + heading nhỏ |
| Hint | **Một dòng** P16: nửa chiều vẫn quét sáng; 1 ngày không quét — icon `E946`; **cấm** đoạn dài 3 câu |
| Giờ hiện có | Grid **2×2** S/T · C/V (`FormatClockDisplay` / `—`) — full width dưới hint, **cấm** cột 180px teo |
| Loại nghỉ trực | **2 radio card** (min-height 56): **1 ngày** (`E787`) / **Nửa buổi chiều** (`E706`); caption phụ; **cấm** ComboBox + nhãn lặp cột phải |
| Khoảng ngày | Từ / Đến **cùng hàng**; live «n ngày»; tóm tắt `{tên} · {loại} · {from}→{to}` |
| Lý do | Textarea ≥ 4 dòng; placeholder ca trực đêm — **cấm** gợi «1 buổi» |
| Nút | Hủy / Lưu cao **44**; Lưu `PrimaryButtonStyle` + icon `E74E` |
| Validate | Banner **Danger** **trong dialog** — **không** đóng, **không** toast |
| Toast | `ToastHost` overlay `MainShellWindow` (góc phải dưới header) — **sau API**, dialog đã đóng |
| Tone | `updated>0` + skip=0 → **Success**; `updated>0` + skip>0 → **Warning**; API fail → **Danger** |
| Auto-dismiss | **4500ms** — parity Web; nút ✕ đóng sớm |
| Skip fields | `ManualAttendanceRangeResult.SkippedFingerprint` / `SkippedSoftLock` từ JSON BE |
| Icon toast | Success `E73E` · Warning `E7BA` · Danger `E783` — `IconFont`; token Success/Warning/Danger bg+fg |
| Copy | `ToastCopy` §2.7.2.1 — Success: `Đã chấm thành công {loại} cho nhân viên {tên}.` |
| HEAD / Admin | Cùng dialog + cùng `App.Toasts` |
| Web | `NghiTrucAssignModal` `max-w-5xl`; radio 2 loại; `showWarning` khi skip |

#### 2.18.3 Checklist D-ATT.2

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-ATT.2a | SPEC + strings + skip DTO | [x] |
| D-ATT.2b | `ToastService` + `ToastHost` trên shell | [x] |
| D-ATT.2c | Redesign `NghiTrucAssignDialog` | [x] |
| D-ATT.2d | Wire HEAD + Admin toast sau wizard | [x] |
| D-ATT.2e | Web modal + FlashBanner warning khi skip | [x] |

#### 2.18.4 HEAD chấm NV thiếu dữ liệu + giải trình (D-ATT.3 / P17)

Binding `SPEC_FINGERPRINT` §4.7.2a. WPF `HeadAttendancePage` + Web `AttendancePage`.

| Mục | Quy tắc |
|-----|---------|
| API | Summary `incompleteExplainAllowed`. Ghi: PUT / manual-range / `nghi-truc-assign` |
| Roster | `editable=false` + P17: mở quick-action NV `IsUnchecked`; khóa NV `IsComplete` |
| Lưu | `ManualRangeDialog` / Web modal: **Lý do giải trình** bắt buộc. Wizard N.trực: `reason` đủ. VE_SOM: lý do về sớm đủ |
| Banner | Copy VN: được chấm NV thiếu dữ liệu; NV đã đủ cần Admin mở khóa. **Không** CTA chờ duyệt P15 cho luồng này |
| `reportBlocked` | Vẫn khóa full roster |

#### 2.18.5 Checklist D-ATT.3

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-ATT.3a | SPEC P17 + summary flag + lock service | [x] |
| D-ATT.3b | WPF HEAD Chấm công — banner + note bắt buộc | [x] |
| D-ATT.3c | Web HEAD Chấm công — cùng rule | [x] |

#### 2.18.6 Lịch thủ công — dialog lớn + lọc trạng thái (D-ATT.4)

Chỉ WPF `ManualScheduleDialog`. **Cấm** đổi API. **Cấm** sửa/xóa từ dialog. Binding §3.2.2.

| Mục | Quy tắc |
|-----|---------|
| Window | **960×640** · `MinWidth` 880 · `MinHeight` 560 · `CenterOwner` · Title chrome **Lịch thủ công** |
| Header trong card | **Một** dòng `Thông tin nhân viên: {mã} - {tên}` (`FontSizeLg` Navy SemiBold) — **cấm** lặp title «Lịch thủ công» trong card |
| Filter | `[Từ · DatePicker 140] [Đến · 140] [Trạng thái · Combo 200] [Tìm]` — `FilterDatePickerStyle` / `FilterComboBoxStyle` / `FilterToolbarLabelStyle` |
| Combo trạng thái | **Tất cả** (mặc định) · Nghỉ phép (`NGHI_PHEP`) · Đi học (`DI_HOC`) · Đi công tác (`DI_CONG_TAC`) · Thai sản (`THAI_SAN`) — **cấm** Đi làm / Đi trễ / Nghỉ trực |
| Apply | Date + combo = **draft** đến **Tìm** (D-UI.48) · **cấm** lọc khi đổi Combo |
| Lọc status | **Client-side** trên `items[].status` sau `GET …/manual-schedule?empCode&from&to` |
| Bảng | `AdminDataGridStyle` · **STT** (§2.21.1) · Từ ngày · Đến ngày · Số ngày · Trạng thái · **cấm** ẩn header khi 0 dòng (D-UI.32) |
| Phân trang | `TablePaginationBar` §2.10 · `UnitLabel` = `khoảng` · default **20** · **luôn hiện** |
| Empty | Overlay giữa lưới: «Chưa có lịch nghỉ phép / đi học / công tác / thai sản trong khoảng đã chọn.» |
| Typography | Chỉ token ThemeResources — **cấm** hardcode FontSize 12/16 |
| Nút | **Tìm** `FilterToolbarPrimaryButtonStyle` · **Đóng** `PrimaryButtonStyle` |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-ATT.4a | SPEC §2.18.6 / §3.2.2 / §2.10.1 | [x] |
| D-ATT.4b | `ManualScheduleDialog` layout + staff line + table header | [x] |
| D-ATT.4c | VM paging + Combo trạng thái draft/applied | [x] |

### 2.19 Admin Cài đặt — Phân quyền, Token kiosk, Hệ thống, Đổi mật khẩu (D5 / A-06–A-07, H-07)

Binding nghiệp vụ: `SPEC_ADMIN.md` §8–§9 · Token kiosk: `SPEC_FINGERPRINT.md` §10.1. **Không** mobile layout / card list.

#### 2.19.0 Foundation (D5.0)

| Thành phần | Rule |
|------------|------|
| Strings | `SettingsUiStrings.cs` — mirror `frontend/src/constants/admin.js` (`accounts`, `settings.system`, `fingerprintTokens`) + đổi MK từ `attendance.js` |
| Models | `BV87.Core/Models/Admin/SettingsModels.cs` + `ChangePasswordRequest` |
| API | `AdminApiClient` — branding, accounts, kiosk tokens · `Bv87ApiClient.ChangePasswordAsync` → `POST /api/auth/change-password` |
| Helpers | `WorkHoursDefaults`, `ImageDataUrlHelper` (5MB, JPG/PNG/GIF/WEBP → data URL) |
| Views | `Views/Admin/Settings/*` · `ViewModels/Admin/Settings/*` |
| Routing | `MainShellWindow.CreatePage` — thay placeholder 4 nav id |

#### 2.19.1 Đổi mật khẩu (A-07, H-07)

| Mục | Rule |
|-----|------|
| Nav | `password` — ADMIN + HEAD |
| Layout | **Hàng ngang** 2 cột khi ADMIN: phải **Đặt lại mật khẩu người dùng** (`Grid` `*` + gap 16px) · HEAD chỉ cột trái (**`Width` 560** cố định, căn trái) · `CardBorderFlatStyle` · `VerticalAlignment=Top` |
| PageHeader | Chỉ `PageTitle` — **cấm** subtitle dưới tiêu đề |
| Password input (D5.1a) | `Controls/PasswordField` — chiều cao **44** cố định · icon mắt toggle hiện/ẩn · **cấm** giãn ngang khi MK dài · dùng trên **Login** + **Đổi mật khẩu** |
| UI (self) ADMIN | Card trái: **chỉ** mật khẩu mới · xác nhận · **Cập nhật mật khẩu** — **cấm** hiện «Mật khẩu hiện tại» (parity HEAD) |
| UI (self) HEAD | Card trái: **chỉ** mật khẩu mới · xác nhận · **Cập nhật mật khẩu** — **cấm** hiện «Mật khẩu hiện tại» (HEAD thường quên MK cũ) |
| Validation (self) | Min 6 ký tự · confirm khớp — parity `ChangePasswordForm.jsx` |
| Validation (self) ADMIN / HEAD | **Không** validate mật khẩu hiện tại |
| API (self) | `POST /api/auth/change-password` (Bearer JWT) — `currentPassword` optional/omit cho **ADMIN và HEAD** |
| **ADMIN — reset user** | **Chỉ ADMIN:** card thứ 2 **Đặt lại mật khẩu người dùng** (khi user quên MK) — **cấm** hiện với HEAD |
| UI (admin reset) | Hint · dropdown **Đơn vị** · ô **Tìm** (tên / tên đăng nhập) · dropdown **Tên nhân viên** (lọc theo đơn vị đã chọn **và** chuỗi tìm) · MK mới + xác nhận · **Đặt lại mật khẩu** (`PrimaryButtonStyle`) — **cấm** nút Tìm kiếm gọi API mỗi lần |
| Tìm tài khoản | Load một lần khi mở: `GET /api/admin/departments` + `GET /api/admin/accounts?page=1&pageSize=500` — lọc **client-side** |
| ComboBox NV | `DisplayMemberPath=StaffPickerLabel` — `{Fullname} — {Username}` |
| Validation (admin reset) | Bắt buộc chọn tài khoản · MK ≥ 6 · confirm khớp — parity dialog Phân quyền §2.19.2 |
| API (admin reset) | `POST /api/admin/accounts/{id}/reset-password` — reuse `ResetPasswordRequest` · **cấm** invent rule ngoài `SPEC_ADMIN` §8 |
| Strings | `SettingsUiStrings.ChangePassword.*` (admin reset) + reuse `SettingsUiStrings.Accounts` cho validation flash |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.25a | SPEC §2.19.1 — ADMIN self không MK hiện tại + filter reset NV | [x] |
| D-UI.25b | `AuthService` + `ChangePasswordPage` / ViewModel | [x] |

#### 2.19.2 Phân quyền (A-06.1)

Parity `UserPermissionsPage` · `SPEC_ADMIN` §8.

| Khối | Rule |
|------|------|
| Layout | PageHeader (**Thêm** only) → flash/error → StatGrid 3 KPI → filter card → DataGrid + `TablePaginationBar` |
| Filter | Vai trò · trạng thái · ô tìm · **Tìm kiếm** · **Xóa lọc** · **Làm mới** (D-UI.42) — **cấm** Làm mới trên `PageHeader` |
| Pagination | **Server-side** `GET /api/admin/accounts?page&pageSize&search&role&status` |
| Cột | TÊN ĐĂNG NHẬP **180** (D-UI.42) · MÃ NV · HỌ VÀ TÊN **160** · VAI TRÒ / ĐƠN VỊ / TRẠNG THÁI / THAO TÁC mỗi `*` MinWidth **120** (D-UI.46) — header `x:Static` §2.14.3 |
| Thao tác | Đặt lại MK · Sửa · Xóa — UI menu §2.19.2.1 |
| Dialogs | Form create/edit · Reset password · Confirm delete |
| HEAD rules | Bắt buộc `empCode`; max 1 HEAD active/dept; sync dept head — **cấm** invent ngoài §8 |

#### 2.19.2.1 Phân quyền — menu THAO TÁC (D-UI.21)

Parity cột THAO TÁC `StaffCatalogPage` (§2.15.1) / token kiosk. **Cấm** 3 nút ngang trong cell.

| Mục | Rule |
|-----|------|
| Nút | **«Thao tác»** (`Accounts.ActionsMenuLabel`) · `SecondaryButtonStyle` · Padding `8,4` · `HorizontalAlignment=Left` |
| Menu | `ContextMenu` code-behind — **Đặt lại MK** · **Sửa** · **Xóa** (Xóa `DangerFgBrush`) |
| Width | **120** |
| Hành vi | Giữ dialog reset / form sửa / `MessageBox` confirm xóa · cấm xóa tài khoản đang login |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.21a | SPEC §2.19.2.1 | [x] |
| D-UI.21b | `PermissionsPage` + `ActionsMenuLabel` | [x] |

#### 2.19.3 Token kiosk (A-06.2)

Parity `FingerprintKioskTokensPage` · `SPEC_FINGERPRINT` §10.1 · **ADMIN only**.

| Khối | Rule |
|------|------|
| KPI | Tổng / Đang dùng / Đã thu hồi (+ Agent Online trên stat grid) |
| Filter | Card **tách** khỏi bảng (§2.7.1 / D-UI.12) — Combo **Đơn vị** · **Trạng thái** · **Agent** · **Tìm kiếm** · **Xóa lọc** · **Làm mới** (spin `IsRefreshing`) — **cấm** cột `*` giữa controls · **cấm** Làm mới trên card bảng |
| Bảng | Khoa · Nhãn Width **180** (D-UI.57) · Token (mono + **Sao chép** luôn hiển thị, token truncate + tooltip) · Trạng thái · Agent · Ngày tạo · Thao tác dropdown — **cấm** cột PIN |
| Pagination | Client-side (list API full) — lọc trên `_allItems` sau Tìm kiếm / Xóa lọc |
| Poll | Refresh list ~60s khi page mở — giữ filter đang áp dụng |
| Modals | Phát hành · Đổi nhãn · Xoay · Thu hồi · Hiện token sau phát hành/xoay — **cấm** Đặt PIN |
| Copy WPF (D1.2f) | Token → **`agent.config.json`** cạnh `BV87.exe` (`kioskToken`) rồi `BV87.exe --agent` — **cấm** hướng dẫn `agent.properties` trên UI WPF |
| PIN kiosk (D5.6) | **Đã xóa.** Enroll USB = JWT Tiện ích §2.17.7. Không `enrollPin` trên DTO; không `POST …/enroll-pin`. Cột DB `enroll_pin` **giữ** (không DROP) |
| Tiêu đề in-card | **Cấm** «Danh sách token» trên card bảng — chỉ DataGrid + pagination (D-UI.22) |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.22a | SPEC §2.19.3 in-card title | [x] |
| D-UI.22b | `KioskTokensPage` bỏ `ListTitle` | [x] |
| D-UI.23a | SPEC filter token kiosk | [x] |
| D-UI.23b | `KioskTokensPage` + ViewModel filter | [x] |
| D-UI.57 | Token nhãn 180 · Audit THỜI GIAN/NGÀY 200 · Nhắc THỜI GIAN GỬI 220 | [x] |

#### 2.19.4 Hệ thống (A-06.3)

Parity `SystemSettingsPage` · `SPEC_ADMIN` §9.

| Section | Nội dung |
|---------|----------|
| 1 | Tên hệ thống |
| 2 | Logo + ảnh nền login (data URL PUT) |
| Chọn ảnh | `OpenFileDialog` **có Owner** = cửa sổ shell (maximized — **cấm** `ShowDialog()` không owner) · JPG/PNG/GIF/WEBP ≤ 5MB → chuỗi `data:{mime};base64,...` |
| Preview | `DataUrlToImageSourceConverter` ủy quyền `BrandingImageHelper.TryCreateImageSource` (StreamSource) — **cấm** `BitmapImage.UriSource` với data URL |
| Lưu ảnh | PUT `logoUrl` / `loginAvatarUrl` = **chuỗi data URL** vào DB `MEDIUMTEXT` — **cấm** chỉ lưu path file local |
| 3 | Giờ hành chính: 4 mốc · 5 midpoint · khung quét read-only · grace · **Đặt lại** draft |
| 4 | Khóa mềm + giờ nhắc |
| Layout | `ScrollViewer` — **cấm** clip section 3/4 |
| Nút **Lưu cài đặt** | Thanh cố định cuối form (card footer) · **`PrimaryButtonStyle`** mặc định · căn phải — **cấm** `NavyButtonStyle` · **cấm** `Padding 20,10` / `MinWidth 180` |
| Lưu (hành vi) | Sau thành công → `App.Branding.ReloadAsync()` (§2.19.6) |

#### 2.19.4.1 Hệ thống — layout cân đối (D-UI.24)

Chỉ `SystemSettingsPage`. **Cấm** đổi field/API.

| Mục | Rule |
|-----|------|
| Nhịp | Card `Padding=20` · khoảng card **16** · gutter cột **12** · nhóm field **16** |
| PageHeader subtitle | `PageSubtitleStyle` · **`FontSizeBase`** (cùng chữ chương trình D1.1u) · `ContentMutedBrush` — **cấm** `FontSizeSm` |
| Title card | `SectionTitleStyle` · margin dưới **16** |
| Label / subsection | `FormLabelStyle` (`FontSizeMd`) — **cấm** `FontWeight=SemiBold` không FontSize |
| Hint / mô tả ô | `FormHintStyle` — **`FontSizeBase`** · `ContentMutedBrush` · wrap — **cấm** `FontSizeSm` / hardcode 12 |
| Nút phụ | `FilterToolbarSecondaryButtonStyle` · compact `Padding 10,6` · `MinHeight 32` |
| Branding | Grid **2 cột** Logo \| Ảnh nền — cùng gutter 12 |
| Ô giờ | Cột `*` đều · gutter 12 · TextBox stretch (không Width cứng lệch) |
| Lỗi ảnh | `NullToVisibility` — không chiếm chỗ khi rỗng |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.24a | SPEC §2.19.4.1 | [x] |
| D-UI.24b | `FormHintStyle` + `SystemSettingsPage` | [x] |
| D-UI.24c | Subtitle + hint = `FontSizeBase` | [x] |
| D-UI.26a | SPEC chọn/lưu ảnh data URL | [x] |
| D-UI.26b | Pick dialog owner + preview StreamSource | [x] |

#### 2.19.6 Branding Desktop — đồng bộ login/shell (D5.5)

Parity Web bootstrap + refresh sau Admin **Lưu cài đặt** (`SystemSettingsPage` → `useSystemSettings` reload branding).

| Thành phần | Rule |
|------------|------|
| API public | `GET /api/public/branding` — không auth |
| API admin save | `PUT /api/admin/settings/branding` — giữ nguyên payload §2.19.4 |
| `AppBrandingService` | Load startup · cache `%LocalAppData%/BV87/branding-cache.json` · `ReloadAsync` sau Lưu |
| `BrandingUiApplicator` | Login (header + nền avatar) · sidebar shell · mode select |
| `BrandingImageHelper` | Data URL → `BitmapImage`; fallback bundled PNG |
| `HospitalBranding` | Hằng fallback: `DefaultPortalTitle`, `LoginProgramSubtitle`, `LogoResourcePath` |
| Normalize title | Legacy `"Bệnh viện Quân y 87"` → `DefaultPortalTitle` (parity Web) |
| Không avatar | Nền login = `SurfacePage`; không placeholder text |
| Cửa sổ đang mở | `ApplyToOpenWindows()` cập nhật ngay sau `ReloadAsync` — không cần đăng xuất |

**Out of scope Desktop:** mobile settings layouts.

#### 2.19.5 Checklist D5

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D5.0 | Foundation §2.19.0 | [x] |
| D5.1 | Đổi mật khẩu §2.19.1 (A-07, H-07) — gồm ADMIN reset user | [x] |
| D5.2 | Phân quyền §2.19.2 (A-06.1) | [x] |
| D5.3 | Token kiosk §2.19.3 (A-06.2) | [x] |
| D5.4 | Hệ thống §2.19.4 (A-06.3) | [x] |
| D5.5 | Branding Desktop §2.19.6 — login/shell sync sau Lưu | [x] |
| D5.6 | Token kiosk: gỡ PIN Java-only (cột + Đặt PIN + API enroll-pin) | [x] |

### 2.20 Mode HEAD — màn hình WPF (D6)

Binding nghiệp vụ: `SPEC_HEAD.md` · UI parity Admin §2.7 / §2.10 · **cấm** mobile layout.

#### 2.20.0 Foundation (D6.0)

| Thành phần | Rule |
|------------|------|
| Strings | `HeadUiStrings.cs` — mirror `frontend/src/constants/attendance.js` (`UI`, filter, attendance labels) |
| Nav shell | Nhóm **Tiện ích** (HEAD): `fingerprint-enroll` — tách khỏi nav chính (parity Admin §2.7) |
| Sidebar logo (D6.0a) | HEAD: dòng phụ dưới portal title = **tên đơn vị** (`UserProfile.DeptName`) · ADMIN: ẩn dòng phụ |
| Pagination | ViewModel list bắt buộc §2.10.2: `GoToPageCommand`, `PageSize`, `TotalItems`, `ShowPagination` |
| Components | Reuse `PageHeader`, `TablePaginationBar`, `AdminDataGridStyle`, `FilterToolbar*` — **cấm** invent layout HEAD riêng |
| Filter toolbar (HEAD) | Nút **Tìm kiếm** · **Làm mới** · **Xóa lọc** (nếu có) **liền kề** trường lọc cuối — **cấm** cột Grid `*` đẩy nút sang mép phải card |
| Label ô text filter (HEAD) | **Cấm** label «Tìm kiếm» (trùng nút) — dùng mô tả trường: «Họ tên», «Họ tên / Mã NV», … |
| API scope | Chỉ `/api/attendance/*`, `/api/head/*`, `/api/auth/*` — **cấm** `/api/admin/**` |

#### 2.20.1 Chấm công HEAD (H-02 / D6.1)

Parity Web `AttendancePage` · UI reference `AdminDeptAttendanceDetailPage` (không lọc đơn vị).

| Khối | Rule |
|------|------|
| Layout | Title `CHẤM CÔNG HẰNG NGÀY` (D-UI.40) → **một hàng**: `{Progress} · Ngày {dd/MM/yyyy}` **cùng hàng** date pills + DatePicker → lock banner → history banner (ngày ≠ hôm nay) → KPI chips **dưới** hàng ngày → filter card → table + pagination → quick-action |
| PageHeader / tiến độ (D-UI.37 / D-UI.40) | Title `HeadUiStrings.Attendance.PageTitle` = `CHẤM CÔNG HẰNG NGÀY` · dòng phụ `{Progress} · Ngày {dd/MM/yyyy}` **không** độc lập dưới title — **cùng hàng ngang** với pill Hôm nay / dd/MM · **cấm** pill bar hàng riêng dưới subtitle |
| Date pills | 4 ngày gần nhất · pill active = `PrimaryLightButtonStyle` · còn lại `FilterToolbarSecondaryButtonStyle` · **ngay sau** text tiến độ (trái → phải: tiến độ · pill · DatePicker) — **cấm** căn phải mép trang |
| Chọn ngày khác (D6.1a) | `DatePicker` (`FilterDatePickerStyle`) cạnh pill bar · **`DisplayDateEnd` = hôm nay** · parity Web `DatePillBar` + `DatePickerPopover` |
| History banner (D6.1a) | Khi `SelectedDate` ≠ hôm nay — banner `PrimaryLightBrush` · text parity Web `HistoryViewBanner` · badge «CHẾ ĐỘ XEM» khi read-only |
| KPI | `statusBreakdown` — chip `PrimaryLightBrush` / `PrimaryLightBorderBrush` · **cấm** hex inline · tooltip `DailyKpiChipTooltip` (chỉ NV đủ dữ liệu; **không** theo lọc bảng) |
| Filter | Hàng 1: label Tìm kiếm + `FilterTextBoxStyle` · label Trạng thái + ComboBox · **Tìm kiếm** + **Làm mới** (`FilterToolbarPrimaryButtonStyle` §2.7.1) — nút **liền kề** combo trạng thái (§2.20.0) |
| «Chưa chấm» (D-UI.39) | Filter = `!isComplete` · tooltip `UncheckedFilterTooltip` — **cấm** hiểu là «chưa có trạng thái» · badge cột vẫn hiện `statusLabel` |
| Tiến độ (D-UI.39) | `Đã chấm {marked}/{total} ({pct}%) · toàn đơn vị` — **cấm** đổi công thức `isComplete` · **cấm** gắn số theo bộ lọc bảng |
| Bảng | `AdminDataGridStyle` · cột MÃ NV · HỌ TÊN · CẤP BẬC · CHỨC VỤ · GIỜ (`FormatClockDisplay`, MinWidth **280**, D-UI.54) · MÁY · TRẠNG THÁI · GHI CHÚ |
| Phân trang | **`TablePaginationBar`** · `UnitLabel` = `nhân viên` · default page size **20** |
| Quick action | Panel dưới bảng khi chọn NV · `SecondaryButtonStyle` + `ShortLabel` · reuse dialogs §2.18 |
| Lock banner | `LockBannerStyle` + token danger — parity H-04 |
| Khoảng cách (D-UI.38) | **16px** giữa mọi khối (header → KPI → filter → bảng) · lock / lỗi / history **Collapsed** khi trống — **cấm** margin còn lại · chip KPI `Margin 0,0,8,8` + host `0,0,0,8` (đáy chip + host = 16; wrap vẫn có 8 dọc) |

#### 2.20.2 Thống kê HEAD (H-05 / D6.2)

Binding nghiệp vụ: `SPEC_HEAD.md` §7 · API `/api/attendance/statistics*`.

| Khối | Rule |
|------|------|
| Layout | `PageHeader` (không Excel, không subtitle) → KPI card → filter card (**Xuất Excel** phải) → bảng lịch sử + `TablePaginationBar` |
| Biểu đồ | **Cấm** trên Desktop WPF — **không** port `AttendanceTrendChart` / donut dashboard; KPI + bảng đủ parity nghiệp vụ |
| PageHeader | Chỉ `HeadUiStrings.Statistics.PageTitle` = `THỐNG KÊ LỊCH SỬ CHẤM CÔNG` (D-UI.40) — **cấm** `PageSubtitle` (D-UI.41) |
| KPI | `statusBreakdown` API (§7.1a) — số lớn **LƯỢT CHẤM CÔNG** = tổng chip = `history.totalItems` · gồm chip **CHƯA CHẤM** (`UNCHECKED` khi > 0) · empty filter: **cấm** ẩn card · chip catalog giữ chỗ count 0 · **cấm** lọc `isComplete` phía WPF · **cấm** hex inline |
| Đơn vị đếm (D-UI.39) | Hint dưới **LƯỢT CHẤM CÔNG**: `KpiHint` **Theo bản ghi đã có — không phải quân số ngày** · tooltip chip UNCHECKED ≠ filter «Chưa chấm» màn Chấm công · **cấm** đổi công thức §7.1a |
| Filter | Preset `TIME_RANGE_PRESETS` (**chỉ** điền Từ/Đến draft — D-UI.48) · Từ/Đến `FilterDatePickerStyle` · label **Họ tên** + ô tìm NV · **Tìm kiếm** + **Xóa lọc** + **Làm mới** **liền kề** ô tìm (§2.20.0) · **Xuất Excel** **phải** cùng hàng (D-UI.41) |
| Phạm vi | Max **366 ngày** · preset mặc định **Tháng này** |
| Bảng lịch sử | `AdminDataGridStyle` · **STT** (§2.21.1) · NGÀY · NHÂN VIÊN (**chỉ họ tên**, không MSNV dưới tên) · TRẠNG THÁI · GHI CHÚ — cell `AdminDataGridTextCellStyle` |
| Phân trang | Server-side API · `TablePaginationBar` · `UnitLabel` = `kết quả` · default page size **20** |
| Export | Nút **Xuất Excel** trên **hàng filter phải** — `ExportExcelCommand` / `GET .../statistics/history/export` không đổi · **cấm** nút trên `PageHeader` |

#### 2.20.4 Nhân viên HEAD (H-06 / D6.3)

Polish `HeadStaffFingerprintPage` — parity D6 layout §2.20.0 · binding §2.17.6.

| Khối | Rule |
|------|------|
| Layout | `PageHeader` → KPI stats → filter card → table card + `TablePaginationBar` |
| PageHeader | Chỉ `HeadUiStrings.Staff.PageTitle` = `NHÂN VIÊN` (D-UI.40) — **cấm** `PageSubtitle` (D-UI.36) |
| KPI | Tổng NV · Đã đăng ký vân tay · Chưa đăng ký — tính từ danh sách fingerprint · **cấm** chart |
| Filter | Label **Họ tên / Mã NV** + ô tìm · Combo trạng thái VT (Tất cả / Đã ĐK / Chưa ĐK) · **Tìm kiếm** + **Xóa lọc** + **Làm mới** (`FilterToolbarPrimaryButtonStyle`) — nút **liền kề** combo (§2.20.0) |
| Bảng | `AdminDataGridStyle` · STT · **ẢNH ĐẠI DIỆN** 140 (§2.15.4) · MÃ NV · HỌ TÊN Width **220** (không `*`) · VÂN TAY `*` MinWidth **280** (badge + tooltip) · THAO TÁC **120** — nút **«Thao tác»** → `ContextMenu` (**Ảnh đại diện** · **Xóa vân tay** disabled nếu chưa ĐK) · **cấm** Họ tên `*` chiếm chỗ Vân tay · **cấm** 2 nút ngang |
| Phân trang | Client-side §2.10.2 · `UnitLabel` = `nhân viên` · default page size **20** |
| Biểu đồ | **Cấm** |

#### 2.20.5 Thông báo (H-08 / D6.4)

Binding `SPEC_HEAD.md` §9 · API `/api/notifications*`.

| Khối | Rule |
|------|------|
| Vị trí | **`MainShellWindow` header** — thay bell placeholder disabled (§2.11) · mode **HEAD + ADMIN** |
| Component | `Controls/NotificationBell` — dropdown popup parity Web `NotificationBell.jsx` |
| Icon (D6.4a / D-UI.43) | Chuông **`FontSize` 24** · nút `MinWidth/MinHeight` **44** · `Padding 8` · badge unread **20×20** · chữ badge **12** |
| Popup (D6.4a / D-UI.43) | **`Width` 400** · **`MaxHeight` 480** · header panel `FontSizeBase` · title item `FontSizeStatLabel` SemiBold · **body `FontSizeMd`** · time `FontSizeSm` · body `MaxHeight` ~56 · **cấm** body `11px` / `FontSizeSm` |
| API | `GET /notifications` · `GET /unread-count` · `PATCH /{id}/read` |
| Poll | 60s khi shell mở · refresh khi mở popup |
| Badge | Số unread (`99+` cap) · ẩn khi 0 |
| Item | Title + body · nền `PrimaryLightBrush` khi chưa đọc |
| Click | `ATTENDANCE_REMINDER` / `UNLOCK_REQUEST_RESULT` → nav **Chấm công** + chọn `attendanceDate` · `UNLOCK_REQUEST` (Admin) → **Yêu cầu mở khóa** |
| Empty | `Không có thông báo.` |
| Biểu đồ | **Cấm** — không màn full-page |

#### 2.20.3 Checklist D6

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D6.0 | Foundation §2.20.0 | [x] |
| D6.1 | Chấm công HEAD §2.20.1 (H-02.1 / D-UI.4 HEAD) | [x] |
| D6.2 | Thống kê HEAD §2.20.2 (H-05) | [x] |
| D6.2a | Thống kê HEAD — cột STT lịch sử (§2.20.2 / §2.21.1) | [x] |
| D-STAT.1 | KPI thống kê = bảng lịch sử (§2.20.2 / SPEC_HEAD §7.1a) | [x] |
| D-STAT.1b | Empty filter — giữ bố cục KPI, số = 0 (§2.20.2) | [x] |
| D6.3 | Nhân viên polish H-06 §2.20.4 | [x] |
| D6.3a | Nhân viên HEAD — Họ tên 220 / Vân tay `*` 280 (§2.20.4) | [x] |
| D-STAFF.1c | Cột Ảnh đại diện trước MÃ NV — Admin + HEAD (§2.15.4) | [x] |
| D6.4 | Thông báo H-08 §2.20.5 | [x] |

### 2.21 Shell content footer (D-UI.15)

Component: `Controls/AppContentFooter` · Shell: `MainShellWindow`.

| Mục | Rule |
|-----|------|
| Vị trí | `MainShellWindow` — hàng **Auto** dưới `ContentHost` (cột main phải sidebar); **cấm** footer trong sidebar |
| Phạm vi | Mọi màn sau login (ADMIN + HEAD); **cấm** trên `LoginWindow` |
| Text | `© 2026 Bệnh viện Quân y 87 v1.0 — Chương trình chấm công Phát triển bởi Ban Tham mưu - Hành chính` |
| Strings | `ShellUiStrings.FooterCopyright` |
| Style | `BorderThickness 0,1,0,0` · `LineBrush` · nền `SurfaceWhiteBrush` · chữ `ContentMutedBrush` · `FontSizeSm` · căn giữa · `Padding 16,10` · `TextWrapping=Wrap` · `TextAlignment=Center` |
| Layout shell | Content `Padding` bottom **20** (footer tách riêng); footer **không** cuộn cùng page content |
| Phân trang bảng | **Không** thay `TablePaginationBar` trong card — footer shell là copyright toàn app |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.15a | SPEC §2.21 | [x] |
| D-UI.15b | `ShellUiStrings` + `AppContentFooter` | [x] |
| D-UI.15c | `MainShellWindow` wiring | [x] |

#### 2.21.1 Cột STT — chuẩn toàn app (D-UI.16)

**Phạm vi:** Mọi `DataGrid` danh sách phân trang (ADMIN + HEAD + Settings + Utilities).

| Mục | Rule |
|-----|------|
| Vị trí | Cột **đầu tiên** |
| Header | `{x:Static ShellUiStrings.ColStt}` → `STT` |
| Width | Token **`DataGridSttColumnWidth`** = **72** |
| Header style | `AdminDataGridColumnHeaderCatalogCenterStyle` (list thường) · dashboard có thể `AdminDataGridColumnHeaderCenterStyle` |
| Cell style | `DataGridSttCellStyle` — căn giữa · **`DataGridCellTextBrush`** |
| Giá trị | `(CurrentPage - 1) × PageSize + index + 1` — helper `PaginationRowNumberHelper.Apply` |
| VM | `RowNumber` trên row VM / `StaffAttendanceRow` |

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| D-UI.16a | SPEC §2.21.1 + sửa §2.8.1 / §2.10.2 | [x] |
| D-UI.16b | Foundation: token + helper + styles | [x] |
| D-UI.16c | Sweep 16 màn list (ADMIN + HEAD + Settings + Utilities) | [x] |

### 2.5 Mode kiosk (deprecated D1.1)

| Mục | Quy tắc |
|-----|---------|
| Login | **Cấm** — đã gỡ nút «Chế độ kiosk» |
| `AppMode` | Chỉ `Head` \| `Admin` — **không** có `Kiosk`; CLI `--mode=kiosk` **bỏ qua** |
| `ModeSelectWindow` | **Đã xóa** (D5) |
| Quét IN/OUT | Phase **D1.2** — WPF Agent (`BV87.exe --agent`) |

### 2.22 Agent chấm công WPF (D1.2)

Màn quét vân tay IN/OUT toàn viện trên máy kiosk — **không** đăng nhập JWT; parity Java `fingerprint-agent` + `SPEC_FINGERPRINT.md` §9.

| Mục | Quy tắc |
|-----|---------|
| Khởi chạy | `BV87.exe --agent` — **cấm** màn Login / Admin / Head · local repo: `.\run.cmd --agent` (script **phải** chuyển `%*` / `$args` qua `dotnet run --`) |
| Cấu hình | **`agent.config.json` cạnh exe** (`apiBaseUrl`, `kioskToken`) — `agent.properties` chỉ fallback Java; UI Admin copy **cấm** ghi `agent.properties` (D1.2f) |
| API | `X-Kiosk-Token`: `GET /api/kiosk/health`, `GET /api/kiosk/fingerprints/templates`, `POST /api/kiosk/fingerprints/scan`, `POST /api/kiosk/heartbeat` |
| JSON POST (D1.2c) | Body **camelCase** (`empCode`, `score`, `clientHostname`, `clientIp`) — parity Java agent; **cấm** PascalCase (`EmpCode`) → BE validation 400 |
| USB ZK9500 | `ZkFingerprintDevice` mode Identify — `DBClear` + `DBAdd(empCode, blob)` toàn viện; poll acquire → `DBIdentify` |
| Nạp mẫu (D1.2b) | `DBAdd` **sau** `Connect` USB (`_db` init) — **cấm** `ReloadTemplates` trước khi thiết bị mở; sau connect/hot-plug → reload ngay |
| Cross-kiosk | POST scan gửi `clientHostname`, `clientIp` — SPEC §4.13.7 |
| Debounce | 2s / `empCode`; gate `scanInFlight` — SPEC §9.3.3 |
| Banner VN | Map `direction`/`status` — không hiện raw `MORNING_IN` / `AFTERNOON_IN` (§9.3.1) |
| Âm thanh | `DesktopSoundService` — Success / Warning / Danger theo tone banner; `soundEnabled` trong config |
| Auto USB | `deviceAutoOpen` + retry (mặc định 5× / 800ms); hot-plug poll **2.5s** khi chưa kết nối (parity D1.1c) |
| Heartbeat | Mặc định 30s — Admin token Online/Offline |
| UI | Fullscreen / maximized; **header** card: logo BV lớn (~100px) + metadata (Đơn vị · Kiosk · Mẫu · Thiết bị) — **cấm** footer status; banner semantic lớn; **giữa**: icon vân tay enroll (Segoe `E962`) + «Chờ đặt ngón tay…» / preview; `Window.Icon` = logo bệnh viện |
| Tên BV (D-UI.59) | Dưới «Chấm công»: `HospitalNameFontSize` **18** SemiBold — nổi hơn size 14 |
| Metadata Thiết bị (D-UI.59) | Cùng recipe **Mẫu đã nạp**: nhãn `ContentMutedBrush` · giá trị `NavyBrush` SemiBold — **cấm** chữ success/danger (dot màu vẫn semantic) |
| Enroll trên agent | **Out of scope D1.2** — enroll qua Admin Tiện ích §2.17.7 (K-04) |
| Autostart | `desktop/scripts/install-agent-autostart.ps1` → `start-agent-silent.vbs` |
| Watchdog | Task `BV87-WPF-Agent-Watchdog` mỗi **2 phút** — parity §9.5.3 (`install-watchdog.ps1`) |
| Config kiosk | `init-agent-config.ps1` tạo `agent.config.json` cạnh exe (**cấm** commit token) |
| Hiện diện (D1.2d) | Agent giữ named mutex `Local\BV87.WpfAgent.Running` suốt đời process — enroll cùng máy biết kiosk đang mở |
| Một instance (D1.2f) | Mutex **exclusive** (`createdNew`) — instance `--agent` thứ hai hiện VN rồi thoát · **cấm** hai cửa sổ quét trên cùng PC · Watchdog `agent.pid` **phải** kiểm tra cmdline `--agent` (không nhầm `BV87.exe` login) |
| USB exclusive (D1.2d) | Một process mở ZK9500. Fallback copy khi IPC không nhường được — **cấm** kill agent. |
| Nhường USB (D1.2e) | IPC cùng session: enroll lease `Local\BV87.Enroll.UsbLease` (giữ khi trang mở) · agent poll **400ms** · event `Local\BV87.Usb.AgentYielded` sau `Disconnect` · enroll chờ tối đa **8s** rồi `Connect`. Banner agent: `UsbPausedForEnroll`. Trả máy khi thả lease. Heartbeat **tiếp tục** khi tạm dừng quét. **Cấm** auto-connect USB khi lease còn. Watchdog không đụng. |

**Deliverables D1.2**

- [x] `agent.config.json.example` + `AgentConfigLoader`
- [x] `KioskApiClient` + DTO scan/template/health
- [x] `ZkNative` — `DBAdd`, `DBClear`, `DBIdentify`, `DBDel`
- [x] `ZkFingerprintDevice` — mode scan/identify
- [x] `AgentScanWindow` + `AgentScanViewModel`
- [x] `App.xaml.cs` — nhánh `--agent`
- [x] Ops scripts: `init-agent-config.ps1`, autostart, watchdog (`desktop/scripts/README.md`)
- [x] D1.2b Reload templates sau USB connect (§2.22)
- [x] D1.2c Kiosk POST JSON camelCase — scan không 400 validation (§2.22)
- [x] D1.2d Enroll cùng máy agent — banner `DeviceHeldByKiosk`, không «kiểm tra cáp» (§2.17.7 / §2.22)
- [x] D1.2e Agent nhường USB cho enroll cùng PC — lease + event + banner 2 phía (§2.17.7 / §2.22)
- [x] D-UI.59 Agent header — tên BV 18 SemiBold · Thiết bị cùng kiểu Mẫu đã nạp (§2.22)
- [x] D1.2f Một `--agent` / máy · ModeSelect không nút kiosk · copy token → `agent.config.json` (§2.19.3 / §2.22)

---

## 3. Mode KIOSK — checklist (D1+)

Tham chiếu `SPEC_FINGERPRINT.md` §9. IDs `K-01` … `K-15`.

- [x] K-01 Quét vân tay IN/OUT (WPF `--agent`)
- [x] K-02 Hiển thị kết quả quét (tên, mã NV, trạng thái)
- [x] K-03 Âm thanh OK / lỗi
- [ ] K-04 Đăng ký vân tay (enroll) + PIN — Admin §2.17.7, không trên agent
- [ ] K-05 Xóa / cập nhật template (theo SPEC) — Admin/Head
- [x] K-06 Kết nối ZK9500 USB (WPF C#)
- [x] K-07 Cấu hình token kiosk + `ApiBaseUrl`
- [x] K-08 Heartbeat kiosk
- [x] K-09 Offline / lỗi mạng — thông báo VN
- [x] K-10 Không hiển thị màn Admin/Head

*(Chi tiết đầy đủ: SPEC_FINGERPRINT — port từng mục khi D1.)*

---

## 4. Mode HEAD — checklist (D2+)

Tham chiếu `SPEC_HEAD.md`. Loại trừ §10 AI. IDs `H-01` … `H-44` (rút gọn phase).

- [x] H-01 Login JWT HEAD (D0)
- [x] H-02 Chấm công ngày — bảng nhân viên đơn vị (WPF `HeadAttendancePage`)
- [x] H-03 Quick status qua modal khoảng ngày (`PUT /api/attendance/manual-range`); VE_SOM ghi chú
- [x] H-04 Khóa sổ / soft-lock — P17: NV thiếu + giải trình; NV đủ vẫn khóa (`SPEC_FINGERPRINT` §4.7.2a)
- [x] H-02.1 Pagination chuẩn `TablePaginationBar` trên `HeadAttendancePage` (§2.10 / D6.1)
- [x] H-05 Thống kê + lịch sử (`HeadStatisticsPage` §2.20.2 — **cấm** biểu đồ WPF)
- [x] H-06 Danh mục nhân viên — xóa vân tay + **ảnh đại diện** khoa mình (`HeadStaffFingerprintPage` §2.17.6 / D-STAFF.1)
- [x] H-07 Đổi mật khẩu (§2.19.1)
- [x] H-08 Thông báo — `NotificationBell` shell header §2.20.5

---

## 5. Mode ADMIN — checklist (D3–D4+)

Tham chiếu `SPEC_ADMIN.md`. Loại trừ §10 AI + `ClinicalFlowPanel`. IDs `A-01` … `A-55` (rút gọn phase).

- [x] A-01 Login JWT ADMIN (D0)
- [x] A-02 Dashboard Tổng quan chung (`AdminDashboardOverviewPage`) — MVP
- [x] A-02.1 Scroll + pagination bar tiêu chuẩn (§2.8)
- [x] A-02.2 STT + đồng bộ pagination/filter toolbar (§2.8.1)
- [x] A-02.3 Pagination bar v2 — `TablePaginationBar` (§2.10)
- [x] A-02.4 Mockup polish KPI + filter + shell header (§2.11)
- [x] A-03 Dashboard Chi tiết đơn vị (`AdminDeptAttendanceDetailPage`)
- [ ] A-03.1 Migrate pagination chuẩn §2.10 lên `AdminDeptAttendanceDetailPage` (D-UI.4)
- [x] A-04.0 Foundation catalog (§2.12)
- [x] A-04.1 Danh mục Cấp bậc (§2.12)
- [x] A-04.2 Danh mục Chức vụ (§2.12)
- [x] A-04.1.1 Polish căn đều cột catalog compact (§2.12.2)
- [x] A-04.3 Danh mục Trạng thái chấm công (§2.13)
- [x] A-04.4 Danh mục Đơn vị (§2.14)
- [x] A-04.5 Danh mục Nhân viên (§2.15)
- [x] A-05 Tiện ích: … Lịch sử vân tay (§2.17.5), **Đăng ký vân tay** (§2.17.7)
- [x] A-06 Cài đặt: Hệ thống, Phân quyền, Token kiosk (§2.19)
- [x] A-07 Đổi mật khẩu (§2.19.1)
- [x] A-08.0 Post-download UX — `ExcelSaveHelper` (§2.16.3)
- [x] A-08.0.1 Shared import — `ExcelImportRunner` (§2.16)
- [x] A-08.1 Export Excel — Cấp bậc & Chức vụ (§2.16)
- [x] A-08.2 Export Excel — Trạng thái chấm công (§2.16.4)
- [x] A-08.3 Export Excel — Đơn vị (§2.16.5)
- [x] A-08.4 Export Excel — Nhân viên (§2.16.6)

**P16-DashboardRefreshDup (Web — đã fix, tham chiếu desktop A-02):** toolbar Tiến độ Chấm công chỉ **một** nút **Làm mới**; bộ lọc đơn vị = dropdown + **Tìm kiếm** (icon kính lúp); **cấm** icon `RotateCcw` cạnh Làm mới.

---

## 6. OUT OF SCOPE

- Web React SPA — **đã xóa** `frontend/` (D5)
- Java `fingerprint-agent/` — **đã xóa** (D5)
- Mobile drawer / card layout
- AI assistant — **đã xóa** endpoint `/api/*/ai/**` (D5)
- Cloudflare Tunnel cho app chấm công
- Thay đổi schema nghiệp vụ ngoài JWT auth endpoints

---

## 7. Phases & checklist triển khai

| Phase | Phạm vi | Trạng thái |
|-------|---------|------------|
| **D0** | SPEC này, JWT backend, WPF shell + login + chọn mode | [x] |
| **D-AUTH.1** | JWT Bearer ghi đè Web session + WPF no cookies (§2.1.1) | [x] |
| **D0.1** | Shell sidebar, ThemeResources, token persist, auto-refresh, logout clear | [x] |
| **D0.2** | Logo bệnh viện + MainShell maximized | [x] |
| **D0.3** | Auto-route ADMIN/HEAD sau login (bỏ chọn mode) | [x] |
| **D-UI** | Design system + Shell v2 (mockup admin) | [x] |
| **D-UI.2** | Polish màn Đăng nhập (§2.9) | [x] |
| **D-UI.3** | A-02.3: `TablePaginationBar` v2 (reference Tổng quan) | [x] |
| **D-UI.4** | Rollout §2.10: Chi tiết đơn vị + HEAD Chấm công | [x] HEAD · [ ] Admin dept |
| **D-UI.5** | A-02.4: mockup KPI, filter, shell header (§2.11) | [x] |
| **D-UI.6** | Tổng quan: rộng cột Tiến độ/Trạng thái/Thao tác + KPI pill font (§2.11.1) | [x] |
| **D-UI.7** | A-03.2: Chi tiết đơn vị — bỏ KPI card, gộp filter, scroll, §2.10 (§2.11.2) | [x] |
| **D-UI.8** | A-03.3: Chi tiết đơn vị — Excel, quét, điền giờ, duyệt, xóa chấm (§2.11.3) | [x] |
| **D-UI.9** | DataGrid row selection — xám nhẹ toàn app (§2.7) | [x] |
| **D-UI.10** | Chi tiết đơn vị — filter parity + menu THAO TÁC (§2.11.4) | [x] |
| **D-UI.11** | Chi tiết đơn vị — thứ tự filter + DatePicker căn giữa (§2.11.5) | [x] |
| **D-UI.12** | Tiện ích — UI parity dashboard & catalog (§2.17.8) | [x] |
| **D-UI.13** | Lịch sử nhắc nhở — bỏ stats card Desktop (§2.17.9) | [x] |
| **D-UI.14** | Nút Tìm kiếm & Làm mới — primary light (§2.7.1) | [x] |
| **D-UI.15** | Shell content footer copyright (§2.21) | [x] |
| **D-UI.16** | Cột STT bắt buộc toàn app (§2.21.1) | [x] |
| **D-UI.17** | Toast shell sau tạo/sửa/xóa — đồng bộ D-ATT.2 (§2.7.2) | [x] |
| **D-UI.18** | Câu toast Đã … thành công/thất bại/cảnh báo (§2.7.2.1) | [x] |
| **D-UI.19** | HEAD Thống kê / Nhân viên — chữ cột Normal (§2.7.3) | [x] |
| **D-UI.20** | Title bar `BVQY87 - Chương trình chấm công` (§2.7.4) | [x] |
| **D-UI.21** | Phân quyền — menu THAO TÁC (§2.19.2.1) | [x] |
| **D-UI.22** | Token kiosk — bỏ tiêu đề «Danh sách token» (§2.19.3) | [x] |
| **D-UI.23** | Token kiosk — filter Đơn vị / Trạng thái / Agent (§2.19.3) | [x] |
| **D-UI.24** | Cài đặt hệ thống — layout cân đối (§2.19.4.1) | [x] |
| **D-UI.25** | Đổi MK Admin — bỏ MK hiện tại + lọc Đơn vị / Tên NV (§2.19.1) | [x] |
| **D-UI.26** | Cài đặt hệ thống — chọn logo/ảnh nền data URL (§2.19.4) | [x] |
| **D-UI.27** | Tổng quan — KPI nhãn trái = pill Đi làm / Đi trễ (`FontSizeMd`) | [x] |
| **D-UI.28** | Làm mới — dừng spin + overlay giữa trang (§2.7.1.1) | [x] |
| **D-UI.29** | Làm mới — overlay chỉ khi chậm; vòng tròn giữa trang (§2.7.1.1) | [x] |
| **D-UI.30** | Tooltip full text mọi cột chữ DataGrid (§2.7.5) | [x] |
| **D-UI.31** | DatePicker toàn app — `dd/MM/yyyy` (§2.7.6) | [x] |
| **D-UI.32** | Tìm kiếm / Làm mới — không ẩn header bảng (§2.7.1.1) | [x] |
| **D-UI.33** | Mọi dialog / cửa sổ con — cùng logo BV với module chính (§2.6) — **superseded D-UI.35** | [x] |
| **D-UI.34** | MessageBox — tiêu đề CẢNH BÁO / XÁC NHẬN, cấm BV87 (§2.6) | [x] |
| **D-UI.35** | Dialog `Window.Icon` = glyph Segoe MDL2, không logo BV (§2.6.1) | [x] |
| **D-UI.36** | Bỏ `PageSubtitle` — Nhân viên HEAD + danh mục hành chính ADMIN (§2.12 / §2.20.4) | [x] |
| **D-UI.37** | HEAD: enroll không subtitle; Chấm công — pill ngày cùng hàng tiến độ, KPI dưới pill (§2.17.7 / §2.20.1) | [x] |
| **D-UI.38** | Chấm công HEAD — khoảng cách khối đều 16px (§2.20.1) | [x] |
| **D-UI.39** | Hint đơn vị đếm — Chấm công vs Thống kê; tooltip «Chưa chấm» (§2.20.1 / §2.20.2) | [x] |
| **D-UI.40** | Page title IN HOA mọi màn WPF (§2.7.7) | [x] |
| **D-UI.41** | Toolbar compact — Thống kê / Tổng quan / Chi tiết / catalog (§2.7.8) | [x] |
| **D-UI.42** | Stat card label 20px + Phân quyền username 180 + Làm mới sau Xóa lọc (§2.7.9) | [x] |
| **D-UI.43** | ADMIN bỏ PageSubtitle · placeholder ô tìm · chuông 24 / body `FontSizeMd` (§2.7.10) | [x] |
| **D-UI.44** | Ký hiệu đơn vị vs mã PK; nhãn `{unitCode} - {tên}` (§2.14.6) | [x] |
| **D-UI.45** | Chi tiết đơn vị — tiến độ dưới title, không ActionsContent (§2.7.11) | [x] |
| **D-UI.46** | Unlock dropdown + Lịch sử VT STT · Enroll Xóa lọc · Phân quyền cột (§2.7.12) | [x] |
| **D-UI.47** | Enroll — ô tìm 360 (full placeholder) + «Chờ đặt ngón tay…» `FontSizeXl` (§2.7.13) | [x] |
| **D-UI.48** | Bộ lọc chỉ chạy khi Tìm kiếm · overlay giữa trang · empty «Không có dữ liệu tìm kiếm phù hợp.» (§2.7.14) | [x] |
| **D-UI.49** | Chi tiết đơn vị — bỏ label Họ tên, ô tìm Width 360 (§2.7.15) | [x] |
| **D-UI.50** | Danh mục Đơn vị — ô tìm Width 440, full placeholder (§2.7.16) | [x] |
| **D-UI.51** | Lịch sử nhắc — Combo lọc Loại gửi (§2.7.17 / §2.17.2) | [x] |
| **D-UI.52** | Login — chữ nét, bỏ DropShadow card (§2.9.1) | [x] |
| **D-UI.53** | Enroll — cột Họ tên Width 220 (§2.7.18) | [x] |
| **D-UI.54** | Cột giờ hiển thị `07:00 AM` / `13:00 PM` (§2.7.19) | [x] |
| **D-UI.55** | Lịch sử vân tay — cột IP máy thực hiện IPv4 (§2.17.5) | [x] |
| **D-UI.56** | Trạng thái chấm công — cột MÃ Width 140 (§2.12.3) | [x] |
| **D-UI.57** | Audit/nhắc/token — nới cột thời gian, ngày chấm, thời gian gửi, nhãn (§2.17.2–3 / §2.19.3) | [x] |
| **D-UI.58** | Audit ĐƠN VỊ 150 · Unlock LÝ DO max 220 / GỬI LÚC 210 · Lịch sử VT THỜI GIAN 200 | [x] |
| **D-UI.59** | Agent — tên BV 18 SemiBold · Thiết bị cùng font/màu Mẫu đã nạp (§2.22) | [x] |
| **D1.2f** | Một `--agent` / máy · gỡ nút ModeSelect kiosk · copy token WPF → `agent.config.json` | [x] |
| **D-STAT.1** | KPI thống kê HEAD đếm như bảng lịch sử (§2.20.2) | [x] |
| **D-STAT.1b** | Empty filter — giữ bố cục KPI thống kê, số = 0 (§2.20.2) | [x] |
| **D-DATA.1** | Đồng bộ Chưa chấm + nav Tổng quan → Chi tiết (§2.11.6) | [x] |
| **D-ATT.1** | Wizard nghỉ trực + lịch thủ công shared (§2.18) | [x] |
| **D-ATT.2** | Wizard nghỉ trực layout lớn + toast shell (§2.18.2) | [x] |
| **D-ATT.3** | HEAD chấm NV thiếu + giải trình P17 (§2.18.4) | [x] |
| **D-ATT.4** | Lịch thủ công — dialog lớn, STT, phân trang, lọc trạng thái (§2.18.6) | [x] |
| **D-STAFF.1** | Avatar NV — Admin form + HEAD danh mục (§2.15 / §2.17.6) | [x] |
| **D-STAFF.1a** | Dialog avatar — header Contact + overlay chọn/xóa (§2.15.3) | [x] |
| **D-STAFF.1b** | HEAD Nhân viên — menu THAO TÁC dropdown (§2.17.6 / §2.20.4) | [x] |
| **D-STAFF.1c** | Cột Ảnh đại diện trước MÃ NV — Admin + HEAD (§2.15.4) | [x] |
| **D1.1** | WPF enroll USB (§2.17.7); bỏ kiosk login | [x] |
| **D1.2** | WPF Agent chấm công (`--agent`, §2.22) | [x] |
| **D1.2d** | Enroll: hết hiểu nhầm cáp khi agent giữ USB (§2.17.7 / §2.22) | [x] |
| **D1.2e** | Agent nhường USB cho enroll cùng PC (§2.17.7 / §2.22) | [x] |
| **D1.2f** | Single-instance `--agent` + copy `agent.config.json` (§2.22 / §2.19.3) | [x] |
| **D5** | Xóa `frontend/` + `fingerprint-agent/` · API prod `:8081` = Spring · bỏ AI + session web · D5.6 gỡ PIN kiosk | [x] |
| **B-BACKUP** | Dump MySQL hàng ngày 22:00 trên PC server Windows · giữ 7 ngày (`deploy/scripts`) | [x] |
| **D-DISK.1** | Banner dung lượng ổ máy chủ trên Admin Tổng quan — chỉ khi gần đầy (§2.8.2) | [x] |
| **D2** | Mode HEAD — Chấm công (bảng NV, quick status, khóa sổ) | [x] |
| **D3** | Admin dashboard Tổng quan + sidebar 4 nhóm | [x] |
| **D3.1** | A-02 polish: scroll + pagination bar Tổng quan | [x] |
| **D3.1.1** | A-02.2: cột STT, pagination ComboBox đồng bộ, filter căn hàng | [x] |
| **D3.2** | Chi tiết đơn vị (MVP) | [x] |
| **D4.0** | Catalog foundation (API client, shared VM/page) | [x] |
| **D4.1** | Cấp bậc + Chức vụ (§2.12) | [x] |
| **D4.1.2** | Catalog compact — header parity & width (§2.12.3) | [x] |
| **D4.2** | Trạng thái chấm công (§2.13) | [x] |
| **D4.3** | Đơn vị + nhóm đơn vị (§2.14) | [x] |
| **D4.3.1** | Đơn vị — typography & cột bảng (§2.14.1) | [x] |
| **D4.3.2** | Đơn vị — header parity Web & fix clip (§2.14.2) | [x] |
| **D4.3.3** | Đơn vị — hotfix header `x:Static` (§2.14.3) | [x] |
| **D4.3.4** | Đơn vị — cỡ chữ cấp bậc cột Trưởng đơn vị (§2.14.4) | [x] |
| **D4.3.5** | Đơn vị — header IN HOA + cân cột TÊN/TRƯỞNG (§2.14.5) | [x] |
| **D4.4** | Nhân viên (§2.15) | [x] |
| **D4.4.1** | Nhân viên — layout & menu thao tác (§2.15.1) | [x] |
| **D4.4.2** | Nhân viên — cột VÂN TAY + pagination typography (§2.15.2) | [x] |
| **D4** | Admin utilities + settings | [ ] |
| **D5** | UAT, gỡ Web prod | [ ] |

### D0 deliverables (done)

- [x] `docs/SPEC_DESKTOP.md` (file này)
- [x] `POST /api/auth/desktop/login`, `POST /api/auth/desktop/refresh`
- [x] `JwtAuthFilter` + cấu hình `app.security.jwt`
- [x] `desktop/BV87.sln` — login JWT, chọn mode, shell placeholder
- [x] P16 Web fix (commit cùng PR)

### D0.1 deliverables (done)

- [x] `ThemeResources.xaml` — semantic color tokens
- [x] `MainShellWindow` — sidebar + header + content frame
- [x] `%AppData%/BV87/session.json` persist sau đăng nhập; **cấm** auto-restore vào shell lúc khởi động (§2.3)
- [x] `BearerTokenHandler` — proactive refresh (&lt; 5 ph) + 401 retry
- [x] Đăng xuất xóa session local

### D0.2 deliverables (Branding + maximized shell — done)

- [x] `Resources/Images/hospital-logo.png` (fallback bundled)
- [x] `Controls/HospitalLogo` + `WindowBrandingHelper` + `AppBrandingService` (§2.19.6)
- [x] Logo/title động trên Login và sidebar shell; icon title bar
- [x] `MainShellWindow` — `WindowState=Maximized` khi mở

### D0.3 deliverables (Auto-route sau login — done)

- [x] Login ADMIN/HEAD → thẳng `MainShellWindow` (bỏ `ModeSelectWindow` sau login)
- [x] `ResolveDefaultMode` từ `user.role`; kiosk **không** trên login (`BV87.exe --agent`)
- [x] Fix binding `SelectedStaffName` — `Mode=OneWay` (Admin Chi tiết đơn vị + HEAD Chấm công)

### D-UI deliverables (Shell v2 + design system — done)

- [x] `ControlStyles.xaml` — Card, DataGrid, filter inputs, buttons phụ
- [x] `MainShellWindow` v2 — header trắng, sidebar icon+active bar, avatar user
- [x] `PageHeader`, `StatusBadge`, `ShellNavIcons`
- [x] Polish `AdminDashboardOverviewPage`, `AdminDeptAttendanceDetailPage`

### D-UI.2 deliverables (Login polish — done)

- [x] `LoginWindow` — card 480×600 (mở rộng ~680 khi banner lỗi), logo 72px, căn giữa dọc, input styled, lỗi semantic — **cấm** clip nút Đăng nhập
- [x] D-UI.52 — `CardBorderFlatStyle` (không DropShadow), TextOptions Display/ClearType, label token (§2.9.1)
- [x] `FilterPasswordBoxStyle` — đồng bộ `FilterTextBoxStyle`
- [x] `PasswordField` — icon mắt hiện/ẩn MK (§2.19.1 D5.1a)

### D2 deliverables (HEAD Chấm công — done)

- [x] `HeadAttendancePage` — bảng NV, KPI, lọc, phân trang
- [x] `AttendanceApiClient` — page, status-types, manual-range, update attendance
- [x] Quick status + modal khoảng ngày; VE_SOM ghi chú
- [x] Lock banner + disable khi `summary.editable=false` / `reportBlocked`

### D3 deliverables (Admin Tổng quan — done)

- [x] Sidebar Admin 4 nhóm (Bảng điều khiển · Danh mục · Tiện ích · Cài đặt)
- [x] `AdminApiClient` — dashboard, departments, reminders, toggle-lock, report-blocks
- [x] `AdminDashboardOverviewPage` — KPI, bảng tiến độ, lọc đơn vị, Làm mới, Gửi nhắc nhở, menu Quản lý

### D3.1 deliverables (A-02 scroll + pagination — done)

- [x] `MainShellWindow` — content fill height, bỏ shell scroll cho page bảng
- [x] `TablePaginationBar` — footer phải: summary · Trước · Sau · page size
- [x] `AdminDashboardViewModel` — `PageSize` selectable (default 20)
- [x] Card bảng «Tiến độ chấm công» — DataGrid scroll nội bộ + footer trong card

### D3.1.1 deliverables (A-02.2 — STT + UI đồng bộ — done)

- [x] §2.8.1 — quy tắc STT, pagination height, filter alignment
- [x] `DeptProgressRowViewModel` + `AdminDashboardViewModel` — STT theo trang
- [x] `AdminDashboardOverviewPage.xaml` — cột STT; toolbar lọc căn hàng
- [x] `TablePaginationBar.xaml` + `ControlStyles.xaml` — `PaginationComboBoxStyle` / `PaginationButtonStyle`

### D-UI.3 deliverables (A-02.3 — pagination bar v2 — done)

- [x] §2.10 — chuẩn footer căn phải; summary «Tổng số N …»; ellipsis khi > 7 trang
- [x] `PaginationPageRange` — helper dãy trang + ellipsis
- [x] `TablePaginationBar` — DPs + nav « ‹ › » + số trang + page size
- [x] `AdminDashboardViewModel` — `GoToPageCommand`; reference `AdminDashboardOverviewPage`

### D-UI.4 deliverables (Rollout pagination chuẩn — pending)

- [ ] §2.10.1 — ma trận màn hình cập nhật trạng thái [x] khi xong từng màn
- [ ] `AdminDeptAttendanceDetailPage` + `AdminDeptAttendanceViewModel` — §2.10.2, `UnitLabel="nhân viên"`
- [ ] `HeadAttendancePage` + `HeadAttendanceViewModel` — §2.10.2, `UnitLabel="nhân viên"`
- [ ] Xóa footer «Trước»/«Sau» tùy biến còn sót trên các màn trên

### D-UI.5 deliverables (A-02.4 — mockup Tổng quan — done)

- [x] §2.11 — shell header, KPI card, filter card, page actions
- [x] `NavyButtonStyle`, `KpiChipNeutralStyle`, `KpiChipActiveStyle`
- [x] `Controls/DashboardKpiBar` — shared KPI summary card
- [x] `AdminDashboardOverviewPage` — filter căn phải; nút icon; KPI bullets
- [x] `MainShellWindow` — brand cố định; profile + logout icon

### D3.2 deliverables (Admin Chi tiết đơn vị — done)

- [x] `AdminDeptAttendanceDetailPage` — chọn đơn vị + ngày, bảng roster (4 mốc giờ, máy, trạng thái, ghi chú)
- [x] Quick status + modal khoảng ngày; VE_SOM ghi chú (Admin không khóa fingerprint presence)
- [x] Mở khóa ngày / Thu hồi mở khóa / Xác nhận yêu cầu mở khóa
- [x] Lọc tìm kiếm + trạng thái khi bấm Tìm kiếm, `TablePaginationBar` §2.10, Làm mới
- [x] A-03.1 / D-UI.7 — layout §2.11.2: bỏ KPI card, gộp filter, scroll bảng
- [x] A-03.3 / D-UI.8 — Xuất Excel, quét, điền giờ, duyệt giờ, xóa chấm (§2.11.3)
- [x] D-ATT.1 — Wizard nghỉ trực + lịch thủ công (§2.18)

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
