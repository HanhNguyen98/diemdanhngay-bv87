# SPEC — Role ADMIN (Quản trị viên)

> **Binding contract.** Mọi thay đổi code liên quan role `ADMIN` phải tuân thủ file này.  
> **Không** thêm / sửa / suy diễn chức năng ngoài phạm vi đã ghi.  
> **Không tự ý sinh code ngoài yêu cầu / ngoài SPEC đã review.**  
> Nếu cần hành vi mới: cập nhật file này **trước**, rồi mới code.

**Nguồn sự thật (source of truth trong repo):**
- Backend: `AdminController`, `AiAssistantController`, `AttendanceController`, `AdminService`, `AdminAccountService`, `AdminDashboardService`, `AttendanceReminderService`, `AttendanceReportService` (+ fingerprint khi P1+)
- Frontend: `AdminApp.jsx`, `AdminShell.jsx`, `constants/admin.js`, `constants/adminTabs.js`, `constants/theme.js`, `tailwind.config.js`, `index.css`
- Chuẩn chung: `.cursorrules`, `docs/CODING_STANDARDS.md`
- Vân tay / Chấm công mới: **`docs/SPEC_FINGERPRINT.md` ưu tiên** khi xung đột với mô tả legacy unlock/khóa sổ

---

## 1. Vai trò & đăng nhập

| Mục | Quy tắc |
|-----|---------|
| Enum | `AccountRole.ADMIN` — label UI: **Quản trị viên** |
| Sau login | `App.jsx` → `view = 'admin'` → lazy-load `AdminApp` |
| Phạm vi | Toàn viện — mọi đơn vị (`dept_code`) |
| Session | Cookie session Spring Security; API tương đối `/api/*` |
| Public không auth | `POST /api/auth/login`, `GET /api/public/branding`, `GET /actuator/health` |
| Admin API | Toàn bộ `/api/admin/**` và `/api/admin/ai/**` bắt buộc `@PreAuthorize("hasRole('ADMIN')")` |

---

## 2. Điều hướng cổng Admin (UI)

### 2.1 Tab IDs (không đổi tên)

| ID | Màn hình | Component |
|----|----------|-----------|
| `dashboard-overview` | Tổng quan chung (mặc định) | `AdminDashboardPage` |
| `dashboard-dept-detail` | Chi tiết Đơn vị | `DeptAttendanceDetailPage` |
| `departments` | Đơn vị | `DepartmentsPage` |
| `staff` | Nhân viên | `StaffPage` (mode admin) |
| `staff-ranks` | Cấp bậc | `StaffRankCatalogPage` |
| `staff-positions` | Chức vụ | `StaffPositionCatalogPage` |
| `status-catalog` | Trạng thái làm việc | `StatusCatalogPage` |
| `utilities-reminder-history` | Lịch sử gửi nhắc nhở | `ReminderHistoryPage` |
| `settings-system` | Cài đặt hệ thống | `SystemSettingsPage` |
| `settings-users` | Phân quyền người dùng | `UserPermissionsPage` |
| `settings-fingerprint-tokens` | Quản lý token vân tay | `FingerprintKioskTokensPage` (P1.2 — `SPEC_FINGERPRINT` §10.1) |
| `password` | Đổi mật khẩu | `ChangePasswordForm` |

- Default tab: `dashboard-overview`
- URL hash: `#admin/{tabId}` (`ADMIN_HASH_PREFIX`)
- Cache tab (giữ mount ẩn): chỉ `departments`, `staff`
- AI panel: `ClinicalFlowPanel` (Admin AI) — luôn mount trong `AdminApp`

### 2.2 Nhóm menu sidebar

1. **Bảng điều khiển** → overview, dept-detail  
2. **Danh mục hành chính** → departments, staff, ranks, positions, status-catalog  
3. **Tiện ích** → reminder-history  
4. **Cài đặt** → system, users, **fingerprint-tokens** (ADMIN; token kiosk Agent)  

Labels tiếng Việt: lấy từ `ADMIN_UI.nav` — **không** hardcode chuỗi mới trong JSX.

---

## 3. Layout, theme, typography, responsive (BẮT BUỘC)

### 3.1 Shell

- Desktop (`lg` ≥ 1024px): sidebar cố định + `AdminTopBar` + main + footer
- Mobile (`max-lg`): `AdminMobileTopBar` + drawer `AdminMobileSideMenu`; sidebar ẩn
- Chiều cao: `h-[100dvh]` / `lg:h-svh`; một vùng scroll dọc (`.mobile-page-y`)
- Padding main mobile: `MOBILE_SHELL_BOTTOM_PADDING_CLASS` (`max-lg:pb-28`) — tránh FAB AI che UI
- Class root: `admin-shell` (font **Montserrat** qua `font-sans`; mobile force `font-size: 1rem`)

### 3.2 Màu — chỉ semantic tokens

Nguồn: `tailwind.config.js` + `frontend/src/constants/theme.js`.  
**Cấm** hex cứng trong JSX. **Cấm** `green-500` / `red-600` mặc định Tailwind cho badge Chấm công admin (dùng `badge-*`, `btn-primary`, `btn-navy`).

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `primary` | `#2563EB` | CTA chính, focus ring, active |
| `primary-hover` | `#1D4ED8` | Hover primary |
| `primary-light` / `sidebar-active` | `#EFF6FF` | Nền active sidebar |
| `navy` | `#001A4D` | Tiêu đề, CTA đậm |
| `navy-soft` | `#2A3F75` | Hover navy |
| `surface-page` | `#F8F9FA` | Nền trang |
| `surface-white` | `#FFFFFF` | Card / bảng |
| `line` | `#E0E0E0` | Viền |
| `content-muted` | `#6C757D` | Chữ phụ |
| `success` / `warning` / `danger` / `info` / `neutral` | theo theme | Badge trạng thái |

CSS classes: `badge-success`, `badge-warning`, `badge-danger`, `badge-info`, `badge-neutral`, `btn-primary`, `btn-navy`, `table-header-row`, `table-th`.

### 3.3 Font & size

- Family: **`Montserrat`**, `system-ui`, `Segoe UI`, `sans-serif` (`font-sans` — một nguồn với HEAD)
- Load: Google Fonts **Montserrat** (400–700) trong `frontend/index.html`
- Scale toàn hệ thống: **+0.20rem** so với Tailwind mặc định (đã cấu hình trong `tailwind.config.js`)
- Dùng `text-3xs` … `text-base` / `text-sm` / `text-lg` theo pattern hiện có — không invent scale mới
- Nguồn FE: `tailwind.config.js` `fontFamily.sans` + `constants/theme.js` `FONT_FAMILY_SANS` + `index.css` (body / admin-shell)
- **Cấm** giữ `EB Garamond` / Garamond / `Times New Roman` / Inter / Roboto / Arial làm UI font chính

### 3.4 Phân trang responsive

| Ngữ cảnh | Mobile | Desktop |
|----------|--------|---------|
| Danh sách registry / bảng chung | 10 | 20 |
| Tiến độ Đơn vị (dashboard) | `MOBILE_DEPT_PROGRESS_PAGE_SIZE` = 10 | `DESKTOP_DEPT_PROGRESS_PAGE_SIZE` = 20 |

Breakpoint chính: **`lg` = 1024px** (`hidden lg:flex`, `lg:hidden`).

---

## 4. Quy tắc dữ liệu chung (Admin cũng phải tuân)

| Quy tắc | Chi tiết |
|---------|----------|
| `dept_code`, `emp_code` | `INT` trong DB/API; **không** lưu chuỗi pad |
| Hiển thị | Backend `CodeFormatter` `%02d` / `%05d`; FE `padStart(2,'0')` / `padStart(5,'0')` |
| Timezone | `Asia/Ho_Chi_Minh` qua `VietnamTimeService` |
| Trạng thái Chấm công | Catalog: `DI_LAM`, `DI_TRE`, `NGHI_PHEP`, `DI_HOC`, `DI_CONG_TAC`, `THAI_SAN` — so sánh bằng code/catalog, không magic string rải rác. **Nguồn DB chung** với HEAD / thống kê / báo cáo (`SPEC_FINGERPRINT`) |
| Message API / UI | **Tiếng Việt**; identifier / JavaDoc / comment method: **Tiếng Anh** |

---

## 5. Khóa sổ, báo cáo & quyền ghi (Admin)

> **Đồng bộ mô hình vân tay:** HEAD **không** còn phụ thuộc cửa sổ 06:00–lockTime để sửa thủ công / gửi báo cáo. Chi tiết: `SPEC_FINGERPRINT.md` + `SPEC_HEAD.md`.  
> API unlock / toggle khóa sổ bên dưới: chỉ giữ nếu phase migration còn dùng trên dashboard Admin; **không** dùng lại làm điều kiện Chấm công HEAD. Khi implement P3, ưu tiên block/unblock **báo cáo** và giám sát tiến độ; không bắt HEAD chờ unlock giờ.

| Hành vi | Admin |
|---------|-------|
| Can thiệp mọi status / ngày / khoa | Có (quyền cao nhất) |
| Xóa thủ công về chưa chấm / mở lại vân tay | Có |
| Session message | `"Quản trị viên - Toàn quyền truy cập"` |

### 5.1 Unlock / toggle khóa sổ (legacy dashboard — không ràng HEAD mới)

- `POST /api/attendance/unlock`, `DELETE /api/attendance/unlock/{deptCode}`
- `POST /api/admin/attendance/toggle-lock/{deptCode}`
- Khi còn trong code: không dùng để khóa luồng vân tay Agent hoặc gửi báo cáo HEAD theo SPEC mới.

### 5.2 Khóa gửi báo cáo (giữ)

- Block: `POST /api/admin/attendance/report-blocks`
- Unblock: `DELETE /api/admin/attendance/report-blocks/{deptCode}`
- Khi block: HEAD không gửi được báo cáo

---

## 6. Bảng điều khiển (Dashboard)

### 6.1 API

| Method | Path | Mục đích |
|--------|------|----------|
| GET | `/api/admin/dashboard` | KPI toàn viện + list summary từng Đơn vị (ngày hôm nay) |
| GET | `/api/attendance/summaries` | Chỉ Admin — tổng hợp toàn viện theo `date` |
| GET | `/api/attendance/page?deptCode=&date=` | Chi tiết 1 đơn vị (summary + staff) — Admin **bắt buộc** truyền `deptCode` |

### 6.2 KPI & bảng tiến độ

- KPI / donut / breakdown: **đủ** `DI_LAM`, `DI_TRE`, `NGHI_PHEP`, `DI_HOC`, `DI_CONG_TAC`, `THAI_SAN` — **cùng nguồn DB** với Chấm công HEAD (`SPEC_FINGERPRINT`)
- Thứ tự card: **Đi làm → Đi trễ (bên phải)** → … trên Tổng quan + Chi tiết Đơn vị (`SPEC_FINGERPRINT` §3.1 P3b)
- Nhãn card trạng thái KPI: **font-weight 700 + chữ đen** — đồng bộ HEAD Chấm công (`SPEC_FINGERPRINT` §10.4 P3c)
- Nhãn card KPI/stat tiếng Việt: **không cắt dấu**, không clip glyph trên chữ in hoa; shell/layout đồng bộ chuẩn `Chi tiết Đơn vị` (`SPEC_FINGERPRINT` §10.5 P3d)
- Mỗi dòng Đơn vị: tiến độ %, hoàn thành / chưa xong (theo COMPLETED mới), trạng thái báo cáo, có tài khoản HEAD
- Thao tác: gửi nhắc, block/unblock báo cáo; không phụ thuộc khóa sổ giờ HEAD
- **Không** thêm cột / KPI ngoài DTO đã review trừ khi cập nhật SPEC

### 6.3 Reminder (P5)

- Manual: `POST /api/admin/attendance/reminders` body `{ deptCodes: [] }` — khoa còn thiếu dữ liệu chấm công
- Chỉ gửi tới account `HEAD` active; thiếu HEAD → `SKIPPED_NO_HEAD`
- Auto: `reminderTime`; tối đa 1 lần AUTO/ngày; target = **ngày hôm qua** còn item §4.5.2
- History: `GET /api/admin/attendance/reminder-history?from=&to=`
- Missing punches: `GET /api/attendance/missing-punches`

### 6.4 Chi tiết Đơn vị

- Chọn đơn vị + ngày → full roster NV active + status + **giờ vào** + **giờ ra** + `source` + ghi chú (cùng nguồn DB; null nếu chưa có record)
- Nút **Chi tiết quét** → `GET /api/attendance/scan-logs` (ADMIN mọi khoa) — `SPEC_FINGERPRINT` §10.3
- **Không** màn lịch sử ra vào riêng
- Export Excel: bổ sung cột giờ vào/ra / DI_TRE / THAI_SAN khi phase P3 — theo `ADMIN_UI.dashboard.deptDetail*`
- Phân trang desktop/mobile theo rule mục 3.4

---

## 7. Danh mục hành chính (CRUD Admin)

Tất cả dưới `/api/admin/...`. Soft-delete / block xóa khi còn ràng buộc — message từ `ADMIN_UI.catalog` / flash.

### 7.1 Nhóm Đơn vị

| Method | Path |
|--------|------|
| GET/POST | `/department-groups`, `/department-groups/next-code` |
| PUT/DELETE | `/department-groups/{groupCode}` |

Xóa chỉ khi nhóm không còn Đơn vị.

### 7.2 Đơn vị

| Method | Path |
|--------|------|
| GET/POST | `/departments`, `/departments/next-code` |
| GET/PUT/DELETE | `/departments/{deptCode}` |

Fields: mã (INT), tên, nhóm, unitCode, vị trí, head, sơ đồ vị trí (nếu có), active.

### 7.3 Nhân viên

| Method | Path |
|--------|------|
| GET | `/staff?search&deptCode&page&pageSize` |
| GET | `/staff/next-code?deptCode=` |
| GET/PUT/DELETE | `/staff/{empCode}` |
| GET | `/staff/{empCode}/department-history` |
| POST | `/staff` |

- Luân chuyển đơn vị: bắt buộc lý do; nếu NV đang là HEAD đơn vị cũ → bắt buộc xác nhận thu hồi quyền HEAD (UI checkbox + message `transferHeadRevoke*`)
- Excel import/export/template: theo `ADMIN_UI.excel` — không đổi format cột ngoài mẫu hiện có
- Mobile `StaffCard` badges: đồng bộ `SPEC_HEAD` §8.1 (compact, không uppercase bold; vân tay rút gọn + `title` đầy đủ)

### 7.4 Cấp bậc / Chức vụ / Trạng thái làm việc

CRUD tương ứng:
- `/staff-ranks`, `/staff-positions`, `/attendance-status-types`
- Có `next-code` cho ranks/positions
- Đang được dùng → không xóa cứng; ưu tiên ngưng hoạt động (message catalog)

---

## 8. Tài khoản & phân quyền

Base: `/api/admin/accounts`

| Rule | Chi tiết |
|------|----------|
| Stats | `GET /accounts/stats` |
| List | `GET /accounts?search&role&status&page&pageSize` (max pageSize backend 500) |
| Create/Update/Delete | POST/PUT/DELETE |
| Reset password | `POST /accounts/{id}/reset-password` — mật khẩu ≥ 6 ký tự |
| Không xóa | Tài khoản đang đăng nhập |
| HEAD account | Bắt buộc chọn `empCode` trong danh mục; **mỗi đơn vị tối đa 1 HEAD active**; sync `department.headEmpCode` |
| ADMIN account | Có thể gắn / không gắn employee; fullname bắt buộc nếu không gắn |

Messages uniqueness HEAD: đúng chuỗi `HEAD_DEPT_TAKEN_MESSAGE` trong `AdminAccountService`.

---

## 9. Cài đặt hệ thống

| API | Nội dung |
|-----|----------|
| GET/PUT `/api/admin/settings/branding` | Tên hệ thống, logo, ảnh nền login, **giờ nhắc tự động**; (phase fingerprint) `late_cutoff`, cửa sổ IN/OUT |

- Nhắc tự động (fallback 08:00) có thể giữ.
- **Không** dùng “giờ mở / giờ chốt sổ 06:00–16:00” để khóa Chấm công HEAD / gửi báo cáo (đã bỏ theo `SPEC_FINGERPRINT` / `SPEC_HEAD`).
- Labels form: `ADMIN_UI.settings.system` — cập nhật copy khi bỏ field khóa sổ khỏi UX.

### 9.1 Quản lý token vân tay (P1.2)

Binding đầy đủ: **`SPEC_FINGERPRINT` §10.1–§10.2** (nav `settings-fingerprint-tokens`, API kiosk-tokens, workflow đổi `agent.properties`).  
File này chỉ ghi nav/tab; **không** duplicate rule nghiệp vụ token.

---

## 10. Admin AI assistant

> Chi tiết binding: `docs/SPEC_AI_ASSISTANT.md` (sau P5).

Base: `/api/admin/ai` — chỉ ADMIN

| Endpoint | Mục đích |
|----------|----------|
| `POST /chat/stream` | SSE chat |
| `POST /tools/execute` | Tools: báo cáo + `list_missing_punches` / `remind_missing_punch_depts` (+ alias cũ) |
| `POST /tools/confirm-reminders` | Xác nhận nhắc — ngày gắn trong `actionId` (mặc định D−1) |

- Có rate limit (`AiRateLimitFilter`)
- Audit log action names hiện có (`ADMIN_AI_*`) — không invent action mới ngoài service hiện tại
- UI: `ClinicalFlowPanel` — không thay đổi vị trí FAB / padding mobile đã định
- Copy / NLP: **không** “chưa nộp báo cáo”; UI dùng thiếu dữ liệu chấm công / thiếu giờ ra / chưa chấm (**cấm** “punch” trên UI)
- Reminder: không bỏ qua ĐƠN VỊ chỉ vì `COMPLETED` nếu còn `MISSING_CHECK_OUT`

---

## 11. API Chấm công Admin được dùng thêm

| Method | Path | Ghi chú |
|--------|------|---------|
| GET | `/api/departments` | Danh sách đơn vị (không dùng lock flags 06:00–16:00 cho luồng HEAD mới) |
| GET | `/api/session/status` | Message admin fixed |
| GET | `/api/attendance/status-types` | Active types — đủ 6 status |
| PUT/POST | `/api/attendance` | Admin quyền cao nhất: có thể sửa/can thiệp status (kể cả DI_LAM/DI_TRE), khoảng ngày thủ công; **cùng nguồn DB** với HEAD |
| POST | `/api/attendance/report-submit` | **Deprecated P5** |
| GET | `/api/attendance/missing-punches` | Hàng đợi thiếu dữ liệu chấm công |
| GET | `/api/attendance/page?deptCode=&date=` | Chi tiết: status, **giờ vào**, **giờ ra**, note — cùng schema fingerprint |

**Completion (đồng bộ SPEC_FINGERPRINT / SPEC_HEAD):**  
`COMPLETED` ⇔ mọi NV active có đúng một status ∈ `{ DI_LAM, DI_TRE, NGHI_PHEP, DI_HOC, DI_CONG_TAC, THAI_SAN }`.  
Không dùng định nghĩa cũ chỉ `markedCount >= total` nếu thiếu làm rõ 6 status.

---

## 12. Clean code & comment (Admin modules)

### Backend
- Class: 1 dòng JavaDoc mục đích
- Public service method: JavaDoc `@param` `@return` `@throws` (English)
- Business rule khó: comment ngắn English
- **Không** comment-out code; **không** Vietnamese trong comment Java

### Frontend
- Label map trong `constants/admin.js` / `adminTabs.js`
- Method/hook không rõ: JSDoc English
- Prefer pattern hiện có: lazy tab, `CachedTabPanel`, `useDeferredValue` / `startTransition` nơi đã dùng (`useAttendancePage` nếu share)
- Không thêm `useMemo`/`useCallback` hàng loạt nếu không cần

---

## 13. Hiệu năng & mạng (LAN 192.x + Tailscale public)

Chương trình chạy đồng thời:
- Nội bộ: dải `192.*` (vd. `192.170.182.14:8081`)
- Public: tunnel free (Tailscale / tương đương `*.ts.net`) — cấu hình CORS/origin qua env, **không** hardcode token trong repo

### Bắt buộc tối ưu

1. **Lazy-load** màn Admin (`React.lazy` + `Suspense`) — đã có trong `AdminApp`
2. **Gộp round-trip**: dùng `/attendance/page` thay vì gọi summary + staff riêng khi load chi tiết
3. **Dashboard**: một `GET /api/admin/dashboard`; tránh N+1 gọi từng phòng từ FE
4. **Phân trang** server-side cho staff/accounts; không tải full list trừ Excel export có chủ đích
5. **Cache tab** departments/staff để không remount mất filter
6. **Ảnh** (logo/avatar): kích thước hợp lý; không base64 khổng lồ trong JSON list nếu API đã có URL
7. **SSE AI**: đóng stream khi unmount; tôn trọng rate limit
8. **CORS**: `allowedOriginPatterns` từ config (local + LAN + public URL) — credentials = true; không wildcard `*` kèm credentials
9. Payload nhẹ trên public tunnel: tránh poll liên tục; refresh dashboard theo nút / sự kiện, không interval dày

---

## 14. Checklist trước khi merge code Admin

- [ ] Endpoint mới có trong spec này và `@PreAuthorize ADMIN` nếu thuộc `/api/admin`
- [ ] UI copy nằm trong `ADMIN_UI` / constants — không English trên UI
- [ ] Màu / font **Montserrat** / breakpoint đúng mục 3
- [x] UI font toàn hệ thống = Montserrat (`index.html` + `tailwind` + `theme.js` + `index.css`) — thay Roboto / EB Garamond
- [ ] `dept_code`/`emp_code` INT + format hiển thị pad
- [ ] Không suy diễn quyền HEAD; block báo cáo vẫn enforce
- [ ] Completion / KPI đủ 6 status; cùng nguồn DB với HEAD
- [ ] Method public có JavaDoc; không dead code
- [ ] Đã kiểm tra layout mobile (`max-lg`) và desktop (`lg`)
- [ ] Không tự ý sinh code ngoài yêu cầu / ngoài SPEC
- [ ] Biometric tuân `SPEC_FINGERPRINT.md` (không lộ template public; **không** DELETE template Web — P2.3)

---

## 15. Vân tay & lịch sử ra vào (ADMIN)

Chi tiết: `docs/SPEC_FINGERPRINT.md`.

| Quyền | ADMIN |
|-------|--------|
| Enroll / đăng ký lại / xóa template | **Chỉ Agent** (đổi `kiosk.token` theo khoa — §10.2 `SPEC_FINGERPRINT`) — **không** Web DELETE/enroll |
| Xem trạng thái ĐK + `fingerLabel` | Toàn viện (GET; không template) |
| Quản lý token / PIN kiosk | Có (Cài đặt — không thay CRUD mẫu) |
| Lịch sử ra vào (giờ vào, giờ ra, đi trễ, logs) | Toàn viện |
| Can thiệp DI_LAM/DI_TRE / xóa thủ công về chưa chấm | Có |
| Catalog | `DI_TRE`, `THAI_SAN` (+ đủ 6 status trên KPI) |
| Dashboard / Excel / AI đọc status | Cùng nguồn DB với HEAD — đủ 6 status |

- LAN: enroll/scan/raw template; Tailscale: chỉ GET trạng thái, **không** template.
- UI: badge ĐI LÀM / ĐI TRỄ riêng; theme mục 3.
- Không invent tab ngoài phase + SPEC.

---

## 16. Phạm vi CẤM (out of scope trừ khi sửa spec)

- Thêm role mới ngoài `ADMIN` / `HEAD`
- Cho HEAD gọi `/api/admin/**`
- Đổi giờ mặc định / timezone ngoài Settings + `VietnamTimeService`
- Hardcode hex / đổi UI font chính sang EB Garamond / Inter / Roboto / Arial (stack chuẩn = **Montserrat**)
- Bỏ lazy-load AdminApp
- Commit secrets (`local-secrets.yml`, tunnel token)
- Tự ý sinh code / API / màn hình ngoài yêu cầu và ngoài SPEC
- Implement vân tay lệch `SPEC_FINGERPRINT.md`
- Giữ KPI/dashboard thiếu `DI_TRE` / `THAI_SAN` hoặc đọc nguồn DB khác Chấm công HEAD
- Khôi phục ràng buộc khóa sổ 06:00–16:00 cho HEAD Chấm công mà không sửa SPEC
