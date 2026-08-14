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
- Chiều cao: `h-[100dvh]` / `lg:h-svh`; root `admin-shell` **`overflow-hidden`** (không scroll cả trang)
- **Một vùng scroll dọc** = `<main>`: class `.mobile-page-y` (`overflow-y: auto`) trên mọi breakpoint; desktop **`lg:overflow-y-auto`** — **cấm** `lg:overflow-hidden` trên `main` (sẽ cắt form dài, không có scrollbar)
- Footer (`AdminFooter`) nằm **ngoài** `main`, `shrink-0` — luôn hiện; nội dung dài cuộn **trong** `main`, không bị footer/FAB che mép dưới
- Màn bảng (`h-full min-h-0 overflow-auto` nội bộ, vd. Chi tiết Đơn vị) vẫn chiếm đúng chiều cao `main` — scroll bảng bên trong, không đổi
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
| Trạng thái Chấm công | Catalog active (`DI_LAM`, `DI_TRE`, `VE_SOM`, `NGHI_TRUC_*`, PHEP/HOC/CT/THAI_SAN, HSQ_BS…) — so sánh bằng code/catalog. **Nguồn DB chung** với HEAD (`SPEC_FINGERPRINT` §4.13) |
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

- KPI / donut / breakdown: **mọi** status catalog active (gồm `VE_SOM`, nhóm `NGHI_TRUC` / `HSQ_BS`) — `mergeBreakdowns` flatten children — **cùng nguồn DB** với Chấm công HEAD (`SPEC_FINGERPRINT` §4.13)
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

- Chọn đơn vị + ngày → full roster NV active + status + **4 mốc giờ** + `lateFlag` + **Máy** (hostname+IP, luôn hiện) + `source` + ghi chú (cùng nguồn DB; null nếu chưa có record)
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
| POST | `/staff/{empCode}/transfer` |
| POST | `/staff` |

- **Luân chuyển đơn vị — API riêng (P6-Adminc):**  
  - `POST /api/admin/staff/{empCode}/transfer`  
  - Body **chỉ**: `{ "deptCode": <int>, "transferReason": "<bắt buộc>", "revokeHeadOnTransfer"?: true }`  
  - **Cấm** gửi / đổi `fullname`, `rankName`, `positionName`, `active`, `avatarUrl` trên API này.  
  - BE: đổi `employees.dept_code` + đóng/mở `employee_department_assignments` + revoke HEAD nếu cần; **không** gọi validate catalog cấp bậc/chức vụ.  
  - Message VN: thiếu lý do / đơn vị đích trùng hiện tại / đơn vị ngưng / thiếu tick thu hồi HEAD.  
  - Toast FE: *「Đã chuyển đơn vị. Vân tay vẫn dùng được tại mọi máy quét.」* (hoặc toast thu hồi HEAD nếu áp dụng).
- **UI Chuyển đơn vị (P6-Admin / P6-Adminc):** nút **「Chuyển đơn vị」** trên grid/card (Admin only); modal chỉ chọn đơn vị đích + lý do (+ thu hồi HEAD); **không** sửa họ tên/cấp bậc/chức vụ; FE gọi **`POST …/transfer`** — **không** dùng `PUT /staff/{empCode}` cho nút này. Vân tay theo `emp_code` — không migrate bảng riêng.
- **Form Sửa (`PUT /staff/{empCode}`):** vẫn được đổi đơn vị kèm `transferReason` (tương thích). Khi giữ nguyên `rankName`/`positionName` đang lưu trên hồ sơ (legacy ngoài catalog active) → **không** từ chối validate catalog; chỉ validate khi Admin **đổi sang** tên mới. **Khuyến nghị UX:** ưu tiên nút Chuyển đơn vị cho luân chuyển thuần.
- **Ô Đơn vị đích (P6-Adminb):** `SearchableSelect` (`frontend/src/components/shared/SearchableSelect.jsx`). Options **hai dạng thống nhất**:
  | Dạng | `options` | `value` / `onChange` | Hiện list |
  |------|-----------|----------------------|-----------|
  | Chuỗi (form Sửa NV cấp bậc/chức vụ, lọc Đơn vị) | `string[]` | chính chuỗi đó | chính chuỗi |
  | Object (modal Chuyển đơn vị) | `{ value, label }[]` | `value` (vd. `deptCode` `"5"`) | `label` (vd. `[05] Phòng …`) |
  Tìm kiếm: `matchesSearchText` trên **chuỗi hiển thị** (`label` hoặc string) — **cấm** render object làm children (crash React). `onChange` object-mode trả **`value` string**, không trả nguyên object. Modal Chuyển đơn vị dùng object-mode; loại đơn vị hiện tại khỏi list.
- **Lịch sử luân chuyển (P6-Admind):** nút **Lịch sử** trên từng NV → modal. `GET /staff/{empCode}/department-history` trả list (mới → cũ). Mỗi dòng sự kiện:
  | Field | Ý nghĩa |
  |-------|---------|
  | `fromDeptCode` / `fromDeptCodeFormatted` / `fromDeptName` | Đơn vị **trước** (null nếu gán ban đầu) |
  | `toDeptCode` / `toDeptCodeFormatted` / `toDeptName` | Đơn vị **sau** (= kỳ assignment của dòng) |
  | `fromDate` / `toDate` | Kỳ hiệu lực tại đơn vị đích |
  | `reason` | Lý do (null nếu gán khi tạo NV) |
  | `createdBy` / `createdAt` | Ai ghi / khi nào |
  | `current` | `true` nếu kỳ đang mở (`toDate` null) |
  | `initial` | `true` nếu không có đơn vị trước (gán ban đầu) |
  UI bảng: cột **Từ** · **Đến** · **Từ ngày** · **Đến ngày** · **Lý do** · **Người ghi** · **Thời điểm**. Mobile: card cùng field. Derive Từ/Đến từ chuỗi kỳ assignment (không bắt buộc cột DB mới).
- Excel import/export/template: theo `ADMIN_UI.excel` — không đổi format cột ngoài mẫu hiện có
- Mobile `StaffCard` badges: đồng bộ `SPEC_HEAD` §8.1 (compact, không uppercase bold; vân tay rút gọn + `title` đầy đủ)

### 7.4 Cấp bậc / Chức vụ / Trạng thái làm việc

CRUD tương ứng:
- `/staff-ranks`, `/staff-positions`, `/attendance-status-types`
- Có `next-code` cho ranks/positions
- Đang được dùng → không xóa cứng; ưu tiên ngưng hoạt động (message catalog)
- `attendance-status-types` phải hỗ trợ thêm metadata:
  - `manualAllowed`: Admin đánh dấu status này có được dùng cho chấm thủ công / quick-action / manual-range hay không
  - `groupParent`: status cha chỉ dùng cho UI/KPI, **không** được ghi trực tiếp vào `attendance_records.status`
  - `parentCode`: status con thuộc status cha nào; status con được lưu DB bình thường
- Example chuẩn cho `HSQ_BS`:
  - `HSQ_BS`: `manualAllowed = true`, `groupParent = true`, `parentCode = null`
  - `HSQ_BS_WORK`: `manualAllowed = true`, `groupParent = false`, `parentCode = HSQ_BS`
  - `HSQ_BS_LEAVE`: `manualAllowed = true`, `groupParent = false`, `parentCode = HSQ_BS`
- Example chuẩn cho nghỉ trực (`SPEC_FINGERPRINT` §4.13.4):
  - `NGHI_TRUC`: `manualAllowed = true`, `groupParent = true`, `parentCode = null`
  - `NGHI_TRUC_FULL`: `manualAllowed = true`, `groupParent = false`, `parentCode = NGHI_TRUC`
  - `NGHI_TRUC_HALF`: `manualAllowed = true`, `groupParent = false`, `parentCode = NGHI_TRUC`
- `VE_SOM`: active, `manualAllowed = true`, không `groupParent` — HEAD/Admin nhập **lý do bắt buộc**; không quick-action khoảng ngày
- **Cấm** ghép nhiều mã vào `attendance_records.status`. Đi trễ + về sớm: `status = VE_SOM` + `late_flag`
- Khi Admin thêm status thủ công mới:
  - status đơn (`parentCode = null`, `groupParent = false`) phải tự xuất hiện ở quick-action HEAD/Admin
  - status con (`parentCode != null`) **không** hiện nút riêng; chỉ xuất hiện trong lựa chọn con của status cha
- KPI breakdown:
  - status cha hiển thị 1 card tổng hợp
  - count card cha = tổng count các status con active thuộc `parentCode = code`
  - card cha có thể hiển thị chi tiết count từng status con trên màn Chấm công

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
| GET/PUT `/api/admin/settings/branding` | Tên hệ thống, logo, ảnh nền login, giờ nhắc, khóa mềm; **giờ hành chính 4 mốc + 5 biên khung quét + grace** (`SPEC_FINGERPRINT` §4.13.1) |

- Nhắc tự động (fallback 08:00) có thể giữ.
- **Không** dùng “giờ mở / giờ chốt sổ 06:00–16:00” để khóa Chấm công HEAD / gửi báo cáo (đã bỏ theo `SPEC_FINGERPRINT` / `SPEC_HEAD`).
- `settings-system` là form dài (section 1–4 + thanh Lưu): **phải cuộn trong `AdminShell` `<main>`** (§3.1). **Cấm** clip mép dưới mục 3 (Khung nhận quét / Grace) hoặc che bằng footer.
- Section **3. Giờ làm việc hành chính** (`SystemSettingsPage`) — binding UI (P7 layout, **cấm tràn ngang**; **cấm cắt dọc**):

| Khối | Rule |
|------|------|
| Hint | 1 dòng dưới H2; token `text-content-muted` |
| Card **Mốc chuẩn** | 4 ô time: Vào sáng / Ra trưa / Vào chiều / Ra chiều. Grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`; **không** `lg:grid-cols-4` |
| Card **Midpoint** | 5 ô: mở cửa sáng / Midpoint 1 / Midpoint trưa / Midpoint 2 / đóng cửa. Grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5`; **cấm** `lg:grid-cols-5` |
| Hàng dưới | 2 card: **Khung nhận quét** (read-only, suy từ midpoint) \| **Grace** (trễ / sớm, phút). `grid-cols-1 lg:grid-cols-2` |
| Ô time / number | `w-full min-w-0 max-w-full`; mỗi cell `min-w-0` |
| Inner card | `rounded-xl border border-line bg-surface-page/40 p-4`; title uppercase `text-xs font-bold` |
| Reset | Nút **Đặt lại** trong section 3 — trả **draft** về mặc định SPEC §4.13.1; **chưa** ghi DB đến khi Lưu |
| Token | Semantic Tailwind; **cấm** hex cứng |

- Labels: `ADMIN_UI.settings.system` (`workHoursMilestoneTitle`, `workHoursMidpointTitle`, `workHoursGraceTitle`, `resetWorkHours`, label ngắn **Vào sáng** / **Ra trưa**… — không nhét “(mốc chuẩn)” vào từng label ô).
- Section **4. Khóa mềm ngày công & nhắc thiếu dữ liệu** — binding UI (label **1 hàng**, không rút copy):

| Khối | Rule |
|------|------|
| Grid | `grid-cols-1 sm:grid-cols-2 gap-4` — full width card; **cấm** `max-w-xl` (cột quá hẹp → wrap label) |
| Label | Copy giữ nguyên `lockTime` / `reminderTime` trong `ADMIN_UI`. Từ `sm`: **`whitespace-nowrap`** — **cấm** xuống dòng `Giờ nhắc thiếu dữ liệu chấm công`. Mobile 1 cột (`max-sm`) được wrap nếu viewport hẹp |
| Ô time | Compact: `w-44` (không `w-full`) — số giờ sát icon đồng hồ; hint vẫn full width cột |
| Token | Semantic Tailwind; **cấm** hex cứng |

### 9.1 Quản lý token vân tay (P1.2)

Binding đầy đủ: **`SPEC_FINGERPRINT` §10.1–§10.2** (nav `settings-fingerprint-tokens`, API kiosk-tokens, workflow đổi `agent.properties`).  
**P1.2d:** Đổi nhãn token đang dùng trên cùng màn — không phát hành lại; chi tiết §10.1.  
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
- Reminder: không bỏ qua ĐƠN VỊ chỉ vì `COMPLETED` nếu còn `INCOMPLETE_PUNCHES` / `MISSING_EARLY_LEAVE_REASON` / `UNMARKED`

---

## 11. API Chấm công Admin được dùng thêm

| Method | Path | Ghi chú |
|--------|------|---------|
| GET | `/api/departments` | Danh sách đơn vị (không dùng lock flags 06:00–16:00 cho luồng HEAD mới) |
| GET | `/api/session/status` | Message admin fixed |
| GET | `/api/attendance/status-types` | Active types (catalog đầy đủ P7) |
| PUT/POST | `/api/attendance` | Admin quyền cao nhất; `VE_SOM` note 1 ngày; khoảng ngày thủ công (**cấm** `VE_SOM` range) |
| PUT | `/api/admin/attendance/times` | Điền **4 ô trống** (§4.6) |
| POST | `/api/attendance/report-submit` | **Deprecated P5** |
| GET | `/api/attendance/missing-punches` | Hàng đợi: `INCOMPLETE_PUNCHES` / `MISSING_EARLY_LEAVE_REASON` / `UNMARKED` |
| GET | `/api/attendance/page?deptCode=&date=` | Chi tiết: status, **4 mốc giờ**, `lateFlag`, note, máy — cùng schema fingerprint |

**Completion (đồng bộ `SPEC_FINGERPRINT` §4.5 / §4.13):**  
`COMPLETED` ⇔ mọi NV active **hợp lệ** (4 mốc hoặc grandfather 2 mốc; `VE_SOM`+note; `NGHI_TRUC_HALF`; thủ công vắng). KPI đếm theo catalog, không hardcode 6 mã.

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
- [ ] Completion / KPI theo §4.13 (gồm `VE_SOM` / `NGHI_TRUC`); grandfather 2 mốc; `mergeBreakdowns` flatten children
- [x] P7b: scan hybrid `source=MIXED`; rời `VE_SOM` xóa note; `late_flag` TINYINT validate
- [x] P7c: catalog `active` / `manual_allowed` / `group_parent` TINYINT validate; deploy runbook V17/V18
- [ ] Method public có JavaDoc; không dead code
- [ ] Đã kiểm tra layout mobile (`max-lg`) và desktop (`lg`)
- [ ] `AdminShell` `<main>`: `.mobile-page-y` + `lg:overflow-y-auto` — `settings-system` cuộn dọc được, không clip mục 3
- [ ] `settings-system` mục 4: label `reminderTime` 1 hàng (`sm+`); ô time compact `w-44` (không `w-full` / không `max-w-xl`)
- [ ] Không tự ý sinh code ngoài yêu cầu / ngoài SPEC
- [ ] Biometric tuân `SPEC_FINGERPRINT.md` (không lộ template public; **không** DELETE template Web — P2.3)
- [x] **P6-Adminb:** `SearchableSelect` string \| `{ value, label }`; modal Chuyển đơn vị chọn Đơn vị đích không crash
- [x] **P6-Adminc:** `POST /staff/{empCode}/transfer` body chỉ deptCode + lý do (+ revoke HEAD); modal không PUT hồ sơ
- [x] **P6-Admind:** Lịch sử luân chuyển hiện **Từ → Đến** + ai / khi / lý do

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
