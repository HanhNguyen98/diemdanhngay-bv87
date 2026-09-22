# SPEC — Role DUTY (Trực ban bệnh viện)

> Binding contract cho role `DUTY`. Client: `docs/SPEC_DESKTOP.md` (mode `duty`).  
> Nghiệp vụ Tổng quan / Chi tiết đơn vị **trùng quyền vận hành với ADMIN** trên hai màn đó.  
> **HEAD không đổi** — `docs/SPEC_HEAD.md`. Catalog / Phân quyền / Kiosk / Hệ thống / nhật ký toàn viện: **ADMIN only**.

---

## 1. Vai trò

| Mục | Quy tắc |
|-----|---------|
| Enum | `AccountRole.DUTY` — label UI: **Trực ban bệnh viện** |
| JWT | `ROLE_DUTY` (cùng pattern `ROLE_{AccountRole}`) |
| DB | `accounts.role` = **VARCHAR(20)** — giá trị `ADMIN` \| `DUTY` \| `HEAD`. **Cấm** MySQL `ENUM('ADMIN','HEAD')` (INSERT `DUTY` → SQL 1265 / HTTP 500) |
| Sau login | WPF `MainShellWindow` mode **duty** — **cấm** màn chọn mode |
| Phạm vi dữ liệu | Toàn viện (vận hành) — **bắt buộc** gắn `emp_code` + `dept_code` từ nhân viên đã chọn (đơn vị công tác; **không** thu hẹp quyền xem/sửa chỉ một khoa) |
| Slot HEAD | **Không** chiếm slot 1 HEAD / khoa — nhiều DUTY / khoa được phép |
| `AuthUser.isHospitalWide()` | `ADMIN` **hoặc** `DUTY` — dùng cho dashboard, khóa sổ, điền giờ, duyệt, xóa chấm, nhắc thủ công, duyệt yêu cầu mở khóa từ Chi tiết |
| `AuthUser.isAdmin()` | **Chỉ** `ADMIN` — catalog, tài khoản, branding, kiosk, enroll toàn viện; nhật ký/tiện ích whitelist chỉ khi **không** có grant `hasScreen` |

---

## 2. Màn hình mặc định (V1)

Sidebar DUTY **chỉ**:

| Nav ID | Label | Quyền |
|--------|--------|--------|
| `dashboard-overview` | Tổng quan chung | **WRITE** — cùng Admin (`AdminDashboardOverviewPage`) |
| `dashboard-dept` | Chi tiết đơn vị | **WRITE** — cùng Admin (`AdminDeptAttendanceDetailPage`) |
| `password` | Đổi mật khẩu | Chỉ mật khẩu **của mình** — **cấm** đặt lại mật khẩu người khác |

**Cấm** hiện: danh mục (đơn vị / NV / cấp bậc / chức vụ / trạng thái), yêu cầu mở khóa (trang hàng đợi), nhật ký chỉnh sửa, lịch sử vân tay, đăng ký vân tay toàn viện, lịch sử nhắc nhở, Phân quyền, Token kiosk, Hệ thống.

HEAD: nav **không đổi**.

---

## 3. Quyền vận hành = ADMIN trên hai màn

DUTY được (cùng API Admin dashboard / Chi tiết):

- Xem KPI + roster toàn viện; lọc đơn vị / ngày (kể cả **Tất cả đơn vị**)
- Gửi nhắc nhở thủ công theo đơn vị + ngày đang lọc
- Khóa sổ / mở khóa sổ; khóa / mở chỉnh sửa HEAD (`report-blocks`)
- Chi tiết: điền giờ trống, duyệt bổ sung giờ, đưa về chưa chấm, nghỉ trực, xem log quét, Excel
- Duyệt / từ chối yêu cầu mở khóa **từ Chi tiết đơn vị** (nút trên roster) — **không** trang hàng đợi `unlock-requests`

Khóa mềm / 1 HEAD / khoa / quyền HEAD: **không đổi**.

---

## 4. API

`AdminController` class: `@PreAuthorize("hasAnyRole('ADMIN','DUTY')")`.  
Endpoint **ADMIN-only** thêm `@PreAuthorize("hasRole('ADMIN')")` (AND với class).

### DUTY được gọi

| Method | Path |
|--------|------|
| GET | `/api/admin/dashboard` |
| GET | `/api/admin/system/storage` |
| POST | `/api/admin/attendance/reminders` |
| POST / DELETE | `/api/admin/attendance/report-blocks` |
| POST | `/api/admin/attendance/toggle-lock/{deptCode}` |
| PUT | `/api/admin/attendance/times` |
| POST | `/api/admin/attendance/payroll-fill/approve` |
| POST | `/api/admin/attendance/clear` |
| POST | `/api/admin/attendance/unlock-requests/{id}/approve` |
| POST | `/api/admin/attendance/unlock-requests/{id}/reject` |
| GET | `/api/admin/attendance/reminder-history` — **khi** `hasScreen(admin.reminder-history)` |
| GET | `/api/admin/attendance/audit-logs` — **khi** `hasScreen(admin.audit-logs)` |
| GET | `/api/admin/fingerprints/audit-logs` — **khi** `hasScreen(admin.fingerprint-history)` |
| GET | `/api/admin/attendance/unlock-requests` (+ pending-count) — **khi** `hasScreen(admin.unlock-requests)` |
| GET | `/api/admin/departments` (đọc combo lọc) |
| POST / DELETE | `/api/attendance/unlock` · `/api/attendance/unlock/{deptCode}` |
| GET/PUT/POST | `/api/attendance/**` hospital-wide (roster, scan-logs, manual-range, nghi-truc) — `assertCanView` / `assertCanWrite` qua `isHospitalWide()` |

### ADMIN-only (DUTY 403 dù có grant)

Catalog write/read quản trị, `GET /api/admin/stats`, nhóm đơn vị, NV CRUD, ranks/positions/status catalog, accounts, branding PUT, kiosk tokens, fingerprints **enroll/delete** (không gồm GET audit-logs đã whitelist ở trên).

Whitelist utilities: **không** `@PreAuthorize("hasRole('ADMIN')")` cứng — service gate `isAdmin()` **hoặc** (`isDuty()` + `hasScreen(code)`) — `SPEC_DUTY` §7.

Service: **không** dùng `isAdmin()` cho đường dashboard/chấm công toàn viện — dùng `isHospitalWide()`.

---

## 5. Tài khoản (Admin → Phân quyền)

CRUD tài khoản theo vai trò — form **thích ứng** role (HEAD / DUTY / ADMIN). Thêm · Sửa · Xóa · Đặt lại MK theo `SPEC_DESKTOP` §2.19.2.

| Mục | Quy tắc |
|-----|---------|
| Tạo/sửa | Combo vai trò: HEAD · ADMIN · **DUTY** |
| Form HEAD | Bắt buộc chọn NV danh mục → `empCode` + `deptCode` + họ tên từ NV; max **1** HEAD active / khoa |
| Form DUTY | **Bắt buộc** chọn NV danh mục → `empCode` + `deptCode` + họ tên từ NV (đơn vị hiển thị read-only từ NV). **Không** áp max-1-HEAD; NV đã gắn tài khoản active khác → lỗi |
| Form ADMIN | Họ tên tự nhập; **không** bắt buộc NV / đơn vị |
| Filter | Vai trò gồm **Trực ban bệnh viện** · lọc / tìm / trang linh hoạt cả 3 role |
| Cột ĐƠN VỊ | Hiện cho HEAD và DUTY (từ `dept` gắn tài khoản); ADMIN trống |

Cấp màn hình theo account = **§7 Screen ACL** (V2 đã mở). Form CRUD role không đổi.

---

## 6. Thông báo

- Yêu cầu mở khóa HEAD → gửi **ADMIN + DUTY**. Click DUTY → **Chi tiết đơn vị** (`deptCode` + `attendanceDate`) — trừ khi account DUTY được grant màn `admin.unlock-requests` thì chuông/nav → hàng đợi.
- Kết quả gửi nhắc nhở → ADMIN + DUTY.
- DUTY **không** nhận hàng đợi list API trừ khi có grant `admin.unlock-requests`.

---

## 7. Screen ACL (Phân quyền màn hình)

Binding UI: `SPEC_DESKTOP` §2.19.2b · `SPEC_ADMIN` §8.1.

| Rule | Chi tiết |
|------|----------|
| Ai cấu hình | **Chỉ ADMIN** — màn Phân quyền thấy **catalog đủ** mọi màn chương trình |
| Nghĩa grant | Tick màn → **toàn bộ** thao tác trong màn (không tách R/W từng nút) |
| Hậu tố UI trùng tên | ` (Admin)` · ` (Trưởng ĐV)` · ` (Trực ban)` — chỉ khi cùng nhãn xuất hiện ở ≥2 mode |
| `screen_code` | Ổn định: `admin.{navId}` · `head.{navId}` · `duty.{navId}` — **cấm** dùng chuỗi UI làm khóa |
| DB | `account_screens(account_id, screen_code)` unique; Flyway **V27** |
| Default | Không có dòng grant → dùng **nav mặc định theo `AccountRole`** (backward compatible) |
| Có grant | Effective = đúng tập đã lưu (subset của **allowed-for-role**) |
| DUTY allowed | Default §2 + whitelist: `admin.unlock-requests`, `admin.reminder-history`, `admin.audit-logs`, `admin.fingerprint-history` |
| DUTY denylist | Catalog (`admin.departments/staff/ranks/positions/statuses`), `admin.settings-permissions`, `admin.settings-permission-groups`, `admin.settings-kiosk`, `admin.settings-system`, `admin.fingerprint-enroll` |
| HEAD allowed | Chỉ `head.*` (attendance, statistics, staff, fingerprint-enroll, password) |
| ADMIN allowed | Chỉ `admin.*` |
| API | `GET /api/admin/screens` · `GET/PUT /api/admin/accounts/{id}/screens` · Login/`/me`: `screenCodes` (list; rỗng/null = default) |
| Shell | Filter nav theo effective screens — **cấm** đổi `AccountRole` / `AppMode` |
| API gate | Màn whitelist DUTY: service cho phép `isAdmin()` **hoặc** (`isDuty()` + `hasScreen`) — **cấm** chỉ ẩn menu · **cấm** `@PreAuthorize ADMIN` cứng trên GET reminder-history / audit-logs / fingerprints/audit-logs / unlock-requests list |

### 7.1 Nhóm quyền (P2 — D-ACL.2)

| Rule | Chi tiết |
|------|----------|
| Ai | **Chỉ ADMIN** — nav `settings-permissions` (hub 2 tab) + CRUD API · **cấm** nav riêng nhóm |
| Mục đích | Nhóm đặt tên (vd. «Giám đốc») = tập màn hình; **vai trò nghiệp vụ** trên UI = tên nhóm |
| Form nhóm | Tên + tick màn (**mọi** màn catalog enable) · **cấm** combo Phạm vi vai trò trên UI |
| `roleScope` nội bộ | **Suy từ** màn đã tick: chỉ `admin.*` → ADMIN · chỉ `head.*` → HEAD · `duty.*` + whitelist trực ban → DUTY · **cấm** trộn nhiều shell |
| DB | `permission_groups.role_scope` vẫn lưu (shell/security) · Flyway **V28** |
| Account form | **Bắt buộc** chọn nhóm · **cấm** combo ADMIN/HEAD/DUTY · chọn **Đơn vị** rồi **Nhân viên** (lọc theo ĐV) · fullname/dept từ NV · `AccountRole` = `roleScope` của nhóm |
| Bootstrap | Username `admin` (seed): không bắt buộc nhóm/ĐV/NV · effective = **full** `admin.*` |
| Effective screens | 1) `admin` không nhóm → full ADMIN · 2) Có nhóm → màn nhóm · 3) Else custom `account_screens` · 4) Else `defaultsFor(role)` |
| Gắn nhóm | Set `permission_group_id` + đồng bộ `accounts.role` · **xóa** `account_screens` |
| Tùy chỉnh | `PUT …/screens` → clear nhóm (override hiếm) |
| Seed nhóm | Trực ban cơ bản / đầy đủ · Trưởng ĐV chuẩn · Quản trị viên đầy đủ (tùy chọn) |
| Cấm | DUTY/HEAD CRUD nhóm · nhiều nhóm / 1 account · nhóm trộn đa shell |

---

## 8. Cấm

- DUTY = clone ADMIN ẩn menu
- DUTY sửa catalog / tài khoản / branding / kiosk / enroll toàn viện (kể cả khi nhìn thấy trong catalog cấu hình — checkbox disable)
- DUTY đặt lại mật khẩu người khác
- Invent `AccountRole` mới thay HEAD
- Grant `head.*` cho account không phải HEAD (và ngược lại)
