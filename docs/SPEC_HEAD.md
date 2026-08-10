# SPEC — Role HEAD (Trưởng đơn vị / Trưởng khoa phòng ban)

> **Binding contract.** Mọi thay đổi code liên quan role `HEAD` phải tuân thủ file này.  
> **Không** thêm / sửa / suy diễn chức năng ngoài phạm vi đã ghi.  
> **Không tự ý sinh code ngoài yêu cầu / ngoài SPEC đã review.**  
> Nếu cần hành vi mới: cập nhật file này **trước**, rồi mới code.

**Nguồn sự thật (source of truth trong repo):**
- Backend: `AttendanceController`, `AttendanceService`, `AttendanceStatisticsService`, `HeadStaffController`, `HeadAiAssistantController`, `NotificationController`, `AuthController` (+ fingerprint services khi P1+)
- Frontend: `Dashboard.jsx`, `AttendancePage.jsx`, `StatisticsPage.jsx`, `HeadStaffPage.jsx`, `HeadAppShell.jsx`, `constants/attendance.js`, `constants/headLayout.js`, `constants/theme.js`, `tailwind.config.js`, `index.css`
- Chuẩn chung: `.cursorrules`, `docs/CODING_STANDARDS.md`, `docs/SPEC_ADMIN.md` (theme dùng chung)
- Vân tay / Chấm công mới: **`docs/SPEC_FINGERPRINT.md` ưu tiên** khi xung đột với mô tả legacy khóa sổ
- `AttendanceLockService` / unlock API: **legacy** — không dùng cho quyền HEAD Chấm công / báo cáo theo SPEC mới

---

## 1. Vai trò & đăng nhập

| Mục | Quy tắc |
|-----|---------|
| Enum | `AccountRole.HEAD` — label: **Trưởng đơn vị** (UI Chấm công cũng dùng “Trưởng phòng”) |
| Sau login | `App.jsx` → `view = 'attendance'` → `Dashboard` (không vào `AdminApp`) |
| Phạm vi dữ liệu | **Chỉ** `deptCode` gắn trên tài khoản — không xem/sửa đơn vị khác |
| Tài khoản | Mỗi đơn vị tối đa **1** HEAD active (do Admin tạo ở Phân quyền); gắn bắt buộc `empCode` |
| Không được gọi | `/api/admin/**`, `/api/admin/ai/**` |

---

## 2. Điều hướng cổng HEAD (UI)

### 2.1 Nav IDs (không đổi tên)

| ID | Label VN | Component |
|----|----------|-----------|
| `home` | Chấm công | `AttendancePage` (default) |
| `statistics` | Thống kê | `StatisticsPage` |
| `staff` | Nhân viên (danh mục hành chính) | `HeadStaffPage` → `StaffPage mode="head"` |
| `password` | Đổi mật khẩu | `ChangePasswordPage` |

Constants: `HEAD_NAV_IDS`, `HEAD_NAV`, `HEAD_CATALOG_NAV`, `HEAD_MOBILE_DRAWER_NAV` trong `constants/attendance.js`.

Desktop sidebar: Chấm công + Thống kê; catalog Nhân viên; đổi mật khẩu / đăng xuất theo shell hiện có.  
Mobile drawer: gộp `HEAD_MOBILE_DRAWER_NAV`.

### 2.2 Breadcrumb

Pattern: `Hệ thống > {màn} > {tên đơn vị}` — `buildHeadBreadcrumb()` trong `headLayout.js`.  
Không invent cấu trúc breadcrumb khác.

---

## 3. Layout, theme, typography, responsive (BẮT BUỘC)

### 3.1 Shell

- Root: `HeadAppShell` — class `head-app-shell`
- Desktop (`lg` ≥ 1024px): `Sidebar` + content + `AppFooter`
- Mobile (`max-lg`): `MobileTopBar` + `MobileSideMenu`; sidebar ẩn
- Chiều cao: `h-[100dvh]` / `lg:h-svh`
- Scroll: `.head-main-scroll` + `.mobile-page-y`; desktop attendance main `HEAD_ATTENDANCE_MAIN_CLASS` (overflow hidden cho bảng); thống kê/nhân viên `HEAD_SCROLL_MAIN_CLASS`
- Padding chuẩn: `HEAD_MAIN_CLASS` / biến thể trong `constants/headLayout.js` — **không** tự ý đổi spacing

### 3.2 Màu / font / size

Giống Admin — **một rule hệ thống**:
- Tokens: `primary`, `navy`, `surface-*`, `line`, `content-*`, semantic `success|warning|danger|info|neutral`
- Font: **Montserrat** stack (`font-sans` trong Tailwind — sans-serif); scale +0.20rem trong `tailwind.config.js`
- Load font: Google Fonts **Montserrat** trong `frontend/index.html` (weights 400–700)
- Classes: `badge-status-*`, `btn-quick*`, `btn-primary`, `btn-navy`, `table-header-row`, `sidebar-link(-active)`
- CTA gửi báo cáo: `bg-attendance-report` / `hover:bg-attendance-report-hover` (`#204FC2` / `#1A42A8` qua token)
- **Cấm** hex cứng trong JSX; **cấm** đổi brand sang purple/cream AI-default; **cấm** EB Garamond / Inter / Roboto làm UI font chính (chuẩn = **Montserrat**)

Labels: `UI`, `MOBILE_UI`, `STATISTICS_UI` trong `constants/attendance.js` — chỉ tiếng Việt cho end user.

### 3.3 Phân trang & list

| Ngữ cảnh | Mobile (`max-lg`) | Desktop |
|----------|-------------------|---------|
| Bảng Chấm công / list chung | `MOBILE_PAGE_SIZE` = 10 | `DESKTOP_PAGE_SIZE` / `ATTENDANCE_PAGE_SIZE` = 20 |
| Lịch sử thống kê | 10 (page) hoặc fetch batch `MOBILE_HISTORY_FETCH_SIZE` = 500 khi scroll-all pattern hiện có | 20 |
| Hook | `useResponsivePageSize()` | |

---

## 4. Quy tắc dữ liệu & mã

| Quy tắc | Chi tiết |
|---------|----------|
| `dept_code` / `emp_code` | INT; hiển thị `%02d` / `%05d` |
| Resolve đơn vị | HEAD: luôn `authUser.deptCode` |
| Nhân viên Chấm công | Chỉ `Employee.active` thuộc đơn vị |
| Status hợp lệ ngày | `DI_LAM`, `DI_TRE`, `NGHI_PHEP`, `DI_HOC`, `DI_CONG_TAC`, `THAI_SAN` |
| Nguồn có mặt | `DI_LAM` / `DI_TRE` **chỉ** từ vân tay (Agent) — xem `SPEC_FINGERPRINT.md` |
| Thủ công HEAD | Chỉ `NGHI_PHEP` \| `DI_HOC` \| `DI_CONG_TAC` \| `THAI_SAN` + **khoảng từ ngày → đến ngày** |
| Chưa chấm | `status == null` |
| Nguồn DB | **Một nguồn** dùng chung Chấm công / thống kê / dashboard / báo cáo (`SPEC_FINGERPRINT` mục Data model) |

---

## 5. Chấm công theo ngày — không khóa sổ 06:00–16:00

> **Đã bỏ** cửa sổ mở/khóa sổ (06:00 → lockTime) cho quyền HEAD sửa / gửi báo cáo.  
> Chi tiết vân tay, rule C đi trễ, hai cổng Agent/Web: **`docs/SPEC_FINGERPRINT.md`**.

| Quy tắc | Chi tiết |
|---------|----------|
| Ngày Chấm công | Quét vân tay = Chấm công **ngày hiện tại** (Asia/Ho_Chi_Minh) |
| HEAD sửa dữ liệu đã quét | **Không** sửa giờ/status từ máy. **Admin** được điền **ô giờ trống** (`SPEC_FINGERPRINT` §4.6) |
| NV đã có `DI_LAM` hoặc `DI_TRE` | HEAD **không** gán thủ công khác cho ngày đó |
| NV đã có thủ công vắng | Agent **không** cập nhật IN/OUT summary (log REJECTED) |
| HEAD ngoại lệ | Chỉ `NGHI_PHEP` \| `DI_HOC` \| `DI_CONG_TAC` \| `THAI_SAN` + khoảng ngày; **không** đè `DI_LAM`/`DI_TRE` |
| Giám sát | Xem realtime + hàng đợi thiếu dữ liệu chấm công (§4.5.2) — **không** nút Gửi báo cáo |
| Cửa sổ IN/OUT trên Agent | Chỉ phân loại quét vào/ra — **không** khóa quyền HEAD theo nộp báo cáo |

Xem ngày khác hôm nay: **chỉ xem** (HistoryViewBanner). Không dùng LockBanner theo 06:00–16:00.

---

## 6. Màn Chấm công hằng ngày

### 6.1 API

| Method | Path | HEAD |
|--------|------|------|
| GET | `/api/attendance/page` | Đơn vị mình — đọc từ **nguồn DB chung** (status, check_in_at, check_out_at) |
| GET | `/api/attendance/summary` / `staff` | Đơn vị mình |
| GET | `/api/attendance/status-types` | Active types (đủ 6 status) |
| PUT/POST | `/api/attendance` | **Whitelist:** chỉ `NGHI_PHEP`\|`DI_HOC`\|`DI_CONG_TAC`\|`THAI_SAN`; 1 ngày (`?date=`); **từ chối** `DI_LAM`/`DI_TRE`/clear; từ chối nếu ngày đã có DI_LAM/DI_TRE từ vân tay |
| PUT | `/api/attendance/manual-range` | Body `empCode`, `status`, `fromDate`, `toDate` — khoảng ngày (§3.2.1 `SPEC_FINGERPRINT`); max 366; **skip** ngày `DI_LAM`/`DI_TRE` + ngày đã submit; **ghi đè** ngày đã thủ công khác |
| POST | `/api/attendance/report-submit` | **Deprecated (P5)** — không dùng |
| GET | `/api/attendance/missing-punches?date=` | Hàng đợi thiếu dữ liệu chấm công khoa mình |
| GET | `/api/attendance/summaries` | **Cấm** — chỉ Admin |
| GET | `/api/attendance/scan-logs?empCode&date&page&pageSize` | Chỉ NV khoa mình — log quét ngày (append-only, lớp B) |

Scan vân tay: **không** qua API này — qua Agent + token kiosk (`SPEC_FINGERPRINT`).

### 6.2 UI bắt buộc

- Header: ngày, KPI, chuông, **hàng đợi thiếu dữ liệu chấm công** — **không** nút **Gửi báo cáo**; **không** UI khóa sổ theo nghĩa nộp báo cáo
- Cột: nhân viên, cấp bậc, chức vụ, **giờ vào**, **giờ ra**, badge **ĐI LÀM** / **ĐI TRỄ** (read-only), thao tác thủ công 4 status + chọn khoảng ngày + **Chi tiết quét**
- Roster: full NV active + null
- **Ẩn** quick-action gán tay ĐI LÀM / ĐI TRỄ
- Search + filter status; Agent Online/Offline khi có kiosk
- Theme/responsive theo mục 3

### 6.3 CompletionStatus / thiếu dữ liệu chấm công (P5)

Đồng bộ **`SPEC_FINGERPRINT` §4.5**:

- Có mặt (`DI_LAM`/`DI_TRE`): hợp lệ chỉ khi đủ **giờ vào + giờ ra**.
- Thủ công vắng: chỉ cần status.
- `COMPLETED` = KPI đủ dữ liệu — **không** cổng nộp.
- Hàng đợi thiếu dữ liệu chấm công (§4.5.2); khóa mềm `lockTime` (§4.7).
- Nút **Gửi báo cáo**: **đã bỏ**.

### 6.4 Mobile roster card (`AttendanceStaffCard` + `MobileQuickActionGrid`)

Áp dụng viewport `< lg` (~390px):

| Rule | Chi tiết |
|------|----------|
| Padding | List `p-2` + card `p-2.5` — **không** chồng nhiều lớp `p-3` khiến grid sát mép |
| Quick actions | Chỉ whitelist thủ công (không DI_LAM/DI_TRE). Grid **`grid-cols-2`** (2×2), `gap-1.5`; nút `min-h` ≤ `3.75rem` |
| Label nút | `text-4xs` + `leading-tight` + `line-clamp-2`; không phình ô |
| Rank / chức vụ | Chip rank compact; chức vụ `truncate`; token `primary-light` / `content-muted` |
| Hàng giờ + trạng thái | **Một hàng** `flex flex-wrap items-center`: Vào / Ra + `StatusBadge` (mobile); hint thiếu giờ ra vẫn dòng riêng nếu có |
| Border / surface | `border-line`, `bg-surface-white` — không `slate-*` / `blue-*` cứng trên card |
| Footer | Link “Lịch thủ công” / “Chi tiết quét”; main đã `pb-24` tránh FAB che |

---

## 7. Màn Thống kê

### 7.1 API

| Method | Path |
|--------|------|
| GET | `/api/attendance/statistics?deptCode&from&to&search` |
| GET | `/api/attendance/statistics/history?...&page&pageSize` |
| GET | `/api/attendance/statistics/history/export?...` |

- Phạm vi: chỉ đơn vị HEAD (`assertCanView`)
- Khoảng tối đa: **366 ngày** (`STATISTICS_UI.maxRangeDays`)
- Preset desktop: `TIME_RANGE_PRESETS`; mobile: `MOBILE_STATISTICS_PRESETS`
- Chart / Excel: cập nhật constants cho đủ 6 status (`DI_TRE`, `THAI_SAN`) khi P3 — không giữ palette chỉ 4 status
- Export Excel: headers gồm ngày, NV, status, giờ vào, giờ ra, ghi chú (phase P3)

### 7.2 UI

- Desktop: header + KPI + chart + bảng lịch sử phân trang
- Mobile: `StatisticsMobileKpiCards` + history cards; scroll pattern hiện có
- Empty: `Không có dữ liệu!`
- KPI / chart / Excel: **đủ status** `DI_LAM`, `DI_TRE`, `NGHI_PHEP`, `DI_HOC`, `DI_CONG_TAC`, `THAI_SAN` — **cùng nguồn DB** với màn Chấm công (`SPEC_FINGERPRINT`)

---

## 8. Màn Nhân viên (HEAD) — quyền hạn chế

- Entry: `HeadStaffPage` → `StaffPage mode="head"`
- API: `GET /api/head/staff`, `GET /api/head/staff/stats` — chỉ đơn vị mình
- **Được**: xem danh sách NV đơn vị; cập nhật **ảnh đại diện** (avatar only); cột/flag **đã đăng ký vân tay** + **ghi chú ngón** (`fingerLabel`, không template)
- Đăng ký / ghi đè / xóa mẫu vân tay: **chỉ trên Agent** (`SPEC_FINGERPRINT` — chốt A); Web HEAD **không** DELETE template
- **Không được**: tạo/sửa/xóa hồ sơ NV, luân chuyển, lịch sử điều chuyển admin, Excel admin CRUD; **không** xóa đăng ký vân tay trên Web
- UI flags: `avatarOnly`, `hideDeptColumn`, không render form/delete/history admin

### 8.1 Mobile card badges (`StaffCard.jsx`)

Áp dụng chung HEAD + Admin (cùng component):

| Rule | Chi tiết |
|------|----------|
| Layout | Hàng `flex flex-wrap gap-1` — không ghép `inline-block` + `ml-*` cạnh nhau |
| Typography | `text-4xs` + `font-semibold`; **không** `uppercase` / `tracking-wide` / `font-bold` trên badge (tránh chữ to trên ~390px) |
| Padding | `px-1.5 py-px`; `max-w-full truncate` |
| Trạng thái | Label constants `Đang hoạt động` / `Ngưng hoạt động` (giữ casing constants) |
| Vân tay | Mobile: hiện `fingerLabel` nếu có, không thì `Đã đăng ký` / `Chưa đăng ký`; `title` = full `Đã đăng ký — {fingerLabel}` khi có ngón |
| Token | `badge-success` / `badge-neutral` — không hardcode hex |
---

## 9. Thông báo & đổi mật khẩu

| API | Mục đích |
|-----|----------|
| GET `/api/notifications` | Danh sách (reminder từ Admin…) |
| GET `/api/notifications/unread-count` | Badge chuông |
| POST `/api/auth/change-password` | Đổi MK; new password ≥ 6; confirm khớp |

UI: `NotificationBell` trên attendance/staff; labels đổi MK trong `UI.*Password*`.

---

## 10. HEAD AI assistant

> Chi tiết binding: `docs/SPEC_AI_ASSISTANT.md` (sau P5).

Base: `/api/head/ai`

| Endpoint | Mục đích |
|----------|----------|
| `POST /chat/stream` | SSE chat; optional `date` = ngày đang xem; **không** lách gán DI_LAM |
| `POST /tools/execute` | `list_missing_punches`, `batch_attendance` (manual only) |
| `POST /tools/confirm-batch-attendance` | Confirm batch ngoại lệ — **từ chối** presence |

**Tools (P5+):**

| Tool | Mục đích |
|------|----------|
| `list_missing_punches` | Hàng đợi thiếu dữ liệu chấm công khoa mình (ngày đang xem / mặc định hôm nay) |
| `batch_attendance` | Batch `NGHI_PHEP` / `DI_HOC` / `DI_CONG_TAC` / `THAI_SAN` |

**UI mount (bắt buộc):**

- FAB **Trợ lý AI** (`HeadFlowPanel`) mount ở `Dashboard` — **hiện trên mọi màn** HEAD (Chấm công, Thống kê, Nhân viên, Đổi MK).
- **Không** chỉ gắn trong `AttendancePage` (tránh mất nút khi đổi `activeNav`).
- Màn Chấm công: đồng bộ `selectedDate` + soft-lock `tableDisabled` + refresh sau batch.
- Màn khác: `date` = hôm nay; **chặn** batch ghi (`tableDisabled`); vẫn xem thiếu dữ liệu.

**Chống lách SPEC (`SPEC_FINGERPRINT` mục 7):**

1. Disable/xóa tool AI batch `DI_LAM` (và tool gán có mặt tay tương đương).  
2. API confirm/preview batch attendance có mặt: lỗi VN — “Đi làm / Đi trễ chỉ ghi nhận qua vân tay.”  
3. UI `HeadFlowPanel`: không còn quick action batch Đi làm; **không** CTA gửi báo cáo.  
4. Soft-lock / `reportBlocked` / màn ngoài Chấm công: vẫn **xem** thiếu dữ liệu chấm công; chỉ chặn ghi batch (chip + free-text intent).  
5. `assertCanWrite` enforce soft-lock **và** Admin `reportBlocked` (cùng nguồn Web + AI) — `SPEC_AI_ASSISTANT` §3.2.  
6. Đổi MK / scroll main: `max-lg:pb-24` tránh FAB che.

UI: `HeadFlowPanel` — không port Admin ClinicalFlow tools sang HEAD.

---

## 11. Clean code & comment (HEAD modules)

### Backend
- Public methods: JavaDoc English (`@param` `@return` `@throws`)
- Exception message: Vietnamese cố định như hiện tại
- Không so sánh status bằng literal rải rác — dùng catalog/enum

### Frontend
- Logic màn Chấm công theo nguồn DB chung + whitelist thủ công
- Layout class lấy từ `headLayout.js`
- Comment method English khi non-obvious; UI string trong `constants/attendance.js`

---

## 12. Hiệu năng & mạng (LAN 192.x + Tailscale `*.ts.net`)

1. Lazy-load pages trong `Dashboard`
2. Một round-trip `/attendance/page` + cache — cùng nguồn với stats
3. `useDeferredValue` cho search; `startTransition` khi đổi ngày
4. Phân trang 10/20
5. SSE AI: cleanup; **không** gọi batch DI_LAM
6. Public tunnel: chỉ GET trạng thái; quét/enroll trên LAN
7. CORS qua env — không commit token

---

## 13. Ma trận quyền HEAD (tóm tắt)

| Hành động | HEAD |
|-----------|------|
| Xem Chấm công / giờ vào–ra đơn vị mình | Có |
| Sửa dữ liệu đã quét vân tay | **Không** |
| Gán tay `DI_LAM` / `DI_TRE` | **Không** |
| Gán thủ công 4 status + khoảng ngày (khi chưa có DI_LAM/DI_TRE) | Có |
| Đổi thủ công về “chưa chấm” | **Không** (chỉ Admin) |
| CRUD đăng ký vân tay NV khoa | **Chỉ Agent** — Web chỉ xem flag/`fingerLabel` |
| Gửi báo cáo hàng ngày | **Không** (P5 — bỏ) |
| Xem thiếu dữ liệu chấm công / gán ngoại lệ | Có |
| Phụ thuộc khóa sổ 06:00–16:00 | **Không** (đã bỏ) |
| Unlock / block report Admin | Không |
| AI batch `DI_LAM` | **Cấm** — tắt tool + API |
| Thống kê / avatar NV khoa | Có |

---

## 14. Vân tay & chấm công (HEAD) — tóm tắt

Chi tiết: `docs/SPEC_FINGERPRINT.md`.

1. Hai cổng: **Agent** (token kiosk) ghi scan; **Web HEAD** xem / thủ công / báo cáo — không gắn khung 6h–16h.  
2. Rule **C** đi làm/đi trễ; badge read-only.  
3. Đã quét DI_LAM/DI_TRE → HEAD không gán status khác.  
4. Thủ công nhiều ngày: from–to cho NGHI_PHEP / DI_HOC / DI_CONG_TAC / THAI_SAN — skip ngày đã vân tay / đã submit; **ghi đè** ngày thủ công khác.  
5. COMPLETED → gửi báo cáo.  
6. Một nguồn DB với thống kê/dashboard.  
7. Tắt AI batch DI_LAM.

---

## 15. Checklist trước khi merge code HEAD

- [ ] Không lộ data đơn vị khác  
- [ ] Whitelist PUT attendance; không DI_LAM/DI_TRE/clear  
- [ ] Không sửa dữ liệu đã quét  
- [ ] AI batch DI_LAM đã tắt API + UI  
- [ ] Không còn phụ thuộc khóa sổ 06:00–16:00 cho Chấm công/báo cáo  
- [ ] Completion / báo cáo đúng SPEC  
- [ ] Copy VN; theme/responsive; font **Montserrat** (`font-sans`); không invent ngoài SPEC  

---

## 16. Cải tiến / edge cases (đồng bộ SPEC_FINGERPRINT §16)

- Sau **đã gửi báo cáo**: HEAD/kiosk **không** đổi summary ngày đó; **Admin** vẫn fill / clear / manual-range đè — clear **không** hủy bản ghi submit (`SPEC_FINGERPRINT` §4.11).
- Khoảng ngày thủ công: cho phép hôm nay và ngày tương lai trong hạn (max 366); HEAD **không** ghi đè ngày đã có `DI_LAM`/`DI_TRE` (skip); ngày đã có **thủ công khác** → **ghi đè** bằng `applyManualStatus` (không từ chối / không bắt Admin). Đồng bộ `SPEC_FINGERPRINT` §3.2.1.
- `DI_HOC` cùng cơ chế khoảng ngày như nghỉ phép / công tác / thai sản.
- Nav fingerprints: chỉ thêm ID khi P1 được giao; cập nhật `HEAD_NAV_IDS` trong cùng PR.

## 17. Phạm vi CẤM

- Cho HEAD vào `AdminApp` hoặc gọi `/api/admin/**`
- Gán/sửa DI_LAM/DI_TRE hoặc dữ liệu quét; xóa về chưa chấm  
- Khôi phục khóa sổ 06:00–16:00 cho HEAD Chấm công mà không sửa SPEC  
- Để sót API/tool AI batch Đi làm  
- Chấm hộ đơn vị khác; magic string status  
- Đổi breakpoint khỏi `lg` (1024px)  
- Tự ý sinh code ngoài yêu cầu; lệch `SPEC_FINGERPRINT.md`  
- IntelliJ ZKFPDemo làm production  
