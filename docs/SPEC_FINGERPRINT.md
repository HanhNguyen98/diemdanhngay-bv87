# SPEC — Vân tay ZK9500 (Fingerprint)

> **Binding contract.** Mọi thay đổi liên quan đăng ký vân tay, Agent, Chấm công IN/OUT phải tuân thủ file này **và** `SPEC_ADMIN.md` / `SPEC_HEAD.md`.  
> **Không** thêm / sửa / suy diễn chức năng ngoài phạm vi đã ghi.  
> **Không tự ý sinh code ngoài yêu cầu / ngoài SPEC đã review.**  
> Nếu cần hành vi mới: cập nhật file SPEC **trước**, được review, rồi mới code.

**Thiết bị / SDK**

| Mục | Giá trị |
|-----|---------|
| Thiết bị | ZKTeco ZK9500 |
| SDK | ZKFinger Standard SDK 5.3.0.33 |
| Demo tham chiếu | `ZKFingerSDK_Windows_Standard/ZKFinger Standard SDK 5.3.0.33/Java/sample/ZKFinger Demo2` |
| Main class mẫu | `com.zkteco.biometric.ZKFPDemo` (tham chiếu SDK) |
| Main class Agent P1 | `com.bv87.fingerprint.agent.FingerprintAgentApp` |
| Thư viện | `ZKFingerReader.jar` |
| Runtime Agent | Java **17** (đã chạy thành công Demo2) |

---

## 0. Quy định triển khai code (BẮT BUỘC)

1. **Không tự ý sinh code ngoài yêu cầu / ngoài SPEC.** Không thêm endpoint, màn hình, cột DB, status, hoặc “tính năng tiện lợi” chưa ghi trong SPEC đã review.
2. **Không suy diễn.** Nếu mơ hồ → hỏi / cập nhật SPEC trước, không đoán.
3. **Thứ tự:** cập nhật SPEC → review → implement đúng phạm vi ticket/phase.
4. **Phase:** chỉ làm phần được yêu cầu trong lần giao việc (vd. chỉ đăng ký + lưu DB thì **không** code sẵn full IN/OUT UI nếu chưa được giao).
5. Clean code, JavaDoc/JSDoc method công khai (English); message UI/API (Vietnamese); theme/layout theo rule hiện tại.
6. Không commit secrets, không expose template vân tay ra Tailscale/public.

---

## 1. Kiến trúc — hai cổng ghi tách biệt

```
[ZK9500 USB]
    → [Java Agent PC khoa — JDK 17 + ZKFingerReader.jar]
         → HTTP API (LAN + token kiosk khoa)
              → [Spring Boot + MySQL — nguồn dữ liệu DUY NHẤT]
                   → [React Web: GET / hiển thị / thủ công HEAD / báo cáo]
```

| Cổng | Ai | Việc được làm | Không gắn với |
|------|-----|----------------|---------------|
| **Agent (kiosk)** | Máy khoa + token kiosk | Enroll trên Agent; Identify Chấm công; POST API | Session HEAD trên web; khung 06:00–16:00 |
| **Web HEAD** | User HEAD đăng nhập | Xem trạng thái ĐK vân tay (+ `fingerLabel`); thủ công; báo cáo — **không** enroll/xóa template | Quét USB / enroll / xóa mẫu trên browser |
| **Web ADMIN** | User ADMIN | Lịch sử; catalog; **Quản lý token vân tay** (Cài đặt — §10.1); can thiệp Chấm công (§4.6/§4.11) — **không** enroll/xóa template trên Web | Quét USB / enroll / xóa mẫu trên browser |

**Đã bỏ** logic “cửa sổ ghi HEAD 06:00 → lockTime ~16:00” cho Chấm công / gửi báo cáo / quyền sửa thủ công theo giờ.  
Thay bằng: quét = Chấm công **ngày hiện tại** → dữ liệu vào DB **realtime** (Admin/HEAD xem ngay). HEAD chỉ gán **ngoại lệ** (khoảng ngày). **Không** còn nút / bắt buộc **Gửi báo cáo** từng khoa từng ngày.

**Kiosk:** 1 máy Windows + 1 ZK9500 / khoa (~35 khoa, ~700 NV).

**Vận hành đã chốt (Agent-first):**

1. Cài **một lần** Agent (fork Demo2 → `fingerprint-agent/`) + token kiosk + `deptCode`; mở sẵn mỗi ngày.  
2. **Enroll:** trên **Agent** (chọn NV → quét 3 lần → lưu DB) — không quét trên Web.  
3. **Mỗi ngày:** NV quét trên Agent → lưu DB (P2+).  
4. **Web HEAD/ADMIN:** xem trạng thái ĐK / lịch sử / báo cáo / can thiệp Chấm công (Admin) — **không** enroll/xóa template trên Web.  
5. **CRUD mẫu vân tay (enroll / ghi đè / xóa):** **chỉ Agent** + token kiosk. Admin enroll khoa khác = đổi `kiosk.token` trên máy Agent (§10.2).  
6. Auth máy khoa: **token kiosk**.

**Production:** Agent `.jar`/Service — không dùng IntelliJ Demo2 hàng ngày.

---

## 2. Phân quyền

| Hành động | HEAD | ADMIN |
|-----------|------|--------|
| Đăng ký / đăng ký lại / xóa template vân tay | **Chỉ Agent** (khoa token) — **không** Web | **Chỉ Agent** (đổi token khoa — §10.2) — **không** Web DELETE/enroll template |
| Xem trạng thái ĐK + `fingerLabel` (không template) | Khoa mình (GET) | Toàn viện (GET staff / fingerprints status) |
| Gán tay `DI_LAM` / `DI_TRE` | **Không** | **Chỉ qua Điền giờ** (§4.6 rule C khi điền `check_in` trống) — **không** có UI đặt có mặt không giờ |
| Gán thủ công `NGHI_PHEP` / `DI_HOC` / `DI_CONG_TAC` / `THAI_SAN` | Được **chỉ khi** NV **chưa** có `DI_LAM`/`DI_TRE` từ vân tay trong ngày (hoặc ngày trong khoảng) | Được |
| Sửa / xóa dữ liệu đã quét (giờ vào/ra, DI_LAM/DI_TRE từ scan) | **Không** | Soft clear (§4.11) / điền ô trống (§4.6) / manual-range đè sang thủ công — **không** ghi đè giờ đã có từ máy khi fill |
| Đổi về “chưa chấm” (soft clear) | **Không** | Được — soft (§4.11); **bắt buộc lý do**; được cả sau submit báo cáo (**không** hủy bản ghi submit) |
| Gán thủ công theo **khoảng từ ngày → đến ngày** | Được (4 status thủ công) | Được — UI trên **Chi tiết Đơn vị** (§3.2.1 / P3f) |
| Xem giờ vào / ra / đi trễ / log | Khoa mình | Toàn viện |
| Giám sát quân số / thiếu dữ liệu chấm công | Xem realtime + hàng đợi ngoại lệ khoa | Dashboard realtime + hàng đợi toàn viện |
| Head AI batch `DI_LAM` | **Cấm** — disable/xóa tool + từ chối API | — |

---

## 3. Trạng thái

### 3.1 Có mặt từ vân tay (2 biến / 2 badge read-only riêng)

| Code | Label | Nguồn |
|------|-------|--------|
| `DI_LAM` | Đi làm | Rule IN phương án **C** (mục 4.2) |
| `DI_TRE` | Đi trễ | Rule IN phương án **C** |

UI: **hai badge hiển thị riêng** — **không** phải nút quick-action.  
Khôi phục `DI_TRE` trong catalog.

#### Catalog `attendance_status_types` (KPI card order — P3b)

KPI HEAD/Admin đọc catalog active theo `sort_order`. Thứ tự bắt buộc:

| sort_order | code | badge | color_key | icon_key |
|------------|------|-------|-----------|----------|
| 1 | `DI_LAM` | ĐI LÀM | green | check |
| 2 | `DI_TRE` | ĐI TRỄ | amber | late |
| 3 | `NGHI_PHEP` | NGHỈ PHÉP | red | x |
| 4 | `DI_HOC` | ĐI HỌC | yellow | graduation |
| 5 | `DI_CONG_TAC` | CÔNG TÁC | blue | briefcase |
| 6 | `THAI_SAN` | THAI SẢN | purple | baby |

- Card **Đi trễ** luôn **ngay bên phải** **Đi làm** (cùng hàng KPI khi đủ chỗ; `sort_order=2`) trên:
  - ADMIN: Bảng điều khiển → Tổng quan; Bảng điều khiển → Chi tiết Đơn vị  
  - HEAD: Hệ thống → Chấm công; Hệ thống → Thống kê  
- Quick-action HEAD **không** gồm `DI_LAM` / `DI_TRE` (chỉ 4 status thủ công).  
- Seed catalog: **prod** Flyway `V12` (+ V4 đã drop `metric_key`); **local** (`flyway.enabled: false`) → `AttendanceStatusCatalogBootstrap` drop legacy `metric_key` nếu còn + upsert 6 status — **không** INSERT P3b trong `data.sql` (tránh lỗi cột `metric_key` / encoding).

### 3.2 Thủ công HEAD (có khoảng ngày)

| Code | Label | Khoảng ngày |
|------|-------|-------------|
| `NGHI_PHEP` | Nghỉ phép | **Có** — từ ngày → đến ngày |
| `DI_HOC` | Đi học | **Có** — từ ngày → đến ngày |
| `DI_CONG_TAC` | Đi công tác | **Có** — từ ngày → đến ngày |
| `THAI_SAN` | Thai sản | **Có** — từ ngày → đến ngày |

Mỗi ngày trong khoảng: tạo/cập nhật bản ghi ngày đó = status thủ công (cùng nguồn DB với Chấm công).  
Không gán chồng lên ngày đã có `DI_LAM`/`DI_TRE` từ vân tay (trừ Admin).

#### 3.2.1 API + UI khoảng ngày (P3d — bắt buộc)

| Hạng mục | Rule |
|----------|------|
| Trigger | HEAD/Admin bấm quick-action 4 status thủ công → **mở modal** (không gán ngay 1 ngày im lặng) |
| UI HEAD | Màn **Chấm công** (`AttendancePage`) |
| UI ADMIN (P3f) | **Chi tiết Đơn vị** — cùng `QuickActionGroup` + `ManualStatusRangeModal` (tái dùng); **không** mở `AttendancePage` cho Admin |
| API ghi | `PUT /api/attendance/manual-range` body: `empCode`, `status`, `fromDate`, `toDate`, `note?` |
| API preview | `POST /api/attendance/manual-range/preview` body: `empCode`, `fromDate`, `toDate` → đếm ngày trùng vân tay / đã submit / sẽ ghi |
| Validation | `fromDate <= toDate`; `(toDate - fromDate) + 1 ≤ 366`; status ∈ whitelist thủ công (khi ghi) |
| Quyền | HEAD: khoa mình; ADMIN: mọi khoa. **Không** bắt buộc chỉ “hôm nay” |
| Mỗi ngày (ghi) | Gọi **`applyManualStatus`** (§4.8.1): `status` thủ công; `source=MANUAL`; **xóa** `check_in_at` / `check_out_at`. Ngày đã có **status thủ công khác** → **ghi đè** (HEAD/Admin cùng semantics; không “từ chối”). |
| Skip (HEAD) | Ngày đã `DI_LAM`/`DI_TRE` → **bỏ qua** (**cấm** ghi đè); ngày đã gửi báo cáo → bỏ qua |
| Skip (ADMIN) | Ngày đã gửi báo cáo: **vẫn được** ghi; ngày đã có mặt vân tay: **được** ghi đè sang thủ công |
| FE lock quick-action | HEAD: disabled khi đã `DI_LAM`/`DI_TRE`. **ADMIN: không khóa** (mở modal để đè qua range) |
| Response ghi | `updatedCount`, `skippedFingerprint`, `skippedReportSubmitted`, `message` VN |
| Nếu `updatedCount=0` | BusinessException — không ngày nào được cập nhật |
| UI modal | `ManualStatusRangeModal.jsx` — FormModal; **không** hint dài; subtitle **`{empCodeFormatted} - {fullname}`**; status; 2 ô date; số ngày; Hủy / Xác nhận |
| Cảnh báo trùng vân tay (HEAD) | Trước khi ghi: nếu preview `skippedFingerprint > 0` → banner cảnh báo VN: có N ngày đã quét vân tay **sẽ bỏ qua**; nút **Tiếp tục** (ghi với skip) / **Hủy** (đóng cảnh báo, không ghi). **Không** nút “Ghi đè”. |
| Admin | Không cảnh báo skip vân tay (`requiresFingerprintSkipConfirm=false`) |
| Sau OK | Refresh trang ngày đang xem; toast `message` |

Đồng bộ `SPEC_HEAD` §6.1.

#### 3.2.2 Xem lịch thủ công của NV (P3e — bắt buộc)

Sau khi gán khoảng ngày (§3.2.1), HEAD/Admin cần xem lại lịch nghỉ phép / đi học / công tác / thai sản **theo NV** — không phải đổi từng ngày trên thanh date.

| Hạng mục | Rule |
|----------|------|
| Trigger HEAD | Link **Lịch thủ công** cạnh **Chi tiết quét** trên hàng NV (màn Chấm công) |
| Trigger ADMIN | Link **Lịch thủ công** cạnh nút menu **Vân tay** (§10.6) — **không** còn link Chi tiết quét đứng riêng (đã gom vào menu) |
| API | `GET /api/attendance/manual-schedule?empCode=&from=&to=` |
| Default khoảng | Mở modal: ô lọc `from` = hôm nay − 30; `to` = hôm nay + 365 — **user được đổi**; bấm **Tìm** mới gọi API với `from`/`to` đã chọn |
| Validation | `from <= to`; max span 400 ngày (BE); FE báo lỗi VN trước khi gọi |
| Nguồn | `attendance_records` với status ∈ `NGHI_PHEP`\|`DI_HOC`\|`DI_CONG_TAC`\|`THAI_SAN` |
| Gộp khoảng | Các ngày **liên tiếp** cùng `status` → một dòng `{ fromDate, toDate, dayCount, status, statusLabel }` |
| Response | `{ empCode, empCodeFormatted, fullname, from, to, items: [...] }` |
| UI | `ManualScheduleModal.jsx` — subtitle `{mã} - {tên}`; **bộ lọc** 2 ô date `Từ` / `Đến` + nút **Tìm**; **không** dòng “Khoảng xem”; bảng = lịch đã gán; empty VN; Đóng |
| UX tải | Lần mở đầu: skeleton trong vùng bảng. Khi **Tìm**: thead/`tbody` ổn định; nút Tìm **không** đổi icon / không `disabled:opacity` (tránh nhấp nháy); chặn double-submit bằng cờ `refreshing` |
| Cấm | Sửa/xóa từ modal này (chỉ xem); không invent màn riêng |

### 3.3 Ưu tiên & khóa chéo

| Đã có trong ngày | Hệ quả |
|------------------|--------|
| `NGHI_PHEP` \| `DI_HOC` \| `DI_CONG_TAC` \| `THAI_SAN` | **Khóa** ghi summary IN/OUT từ vân tay; scan có thể log `REJECTED` |
| `DI_LAM` \| `DI_TRE` từ vân tay | HEAD **không** được gán thủ công khác; **không** sửa giờ quét. **Admin** được điền **ô giờ trống** (§4.6). Có mặt chỉ **hợp lệ** khi đủ 2 giờ (§4.5) |
| Chưa có status | Cho quét IN/OUT; HEAD được gán thủ công |

---

## 4. IN / OUT, log, phương án C (đi trễ)

### 4.1 Hai pha / ngày

| Direction | Ý nghĩa | Summary hiển thị |
|-----------|---------|------------------|
| `IN` | Vào làm | Theo rule **C** → `check_in_at` + `DI_LAM`/`DI_TRE` |
| `OUT` | Ra về | `check_out_at` = **MAX** các lần OUT hợp lệ; **không** đổi `DI_LAM`/`DI_TRE`/thủ công đã có. OUT-only (chưa IN): vẫn tạo bản ghi ngày (§4.4) |
| Mọi lần | | Insert `fingerprint_scan_logs` (append-only) |

Timezone: `Asia/Ho_Chi_Minh`. Chỉ **ngày hiện tại** khi scan (trừ Admin can thiệp sau này nếu SPEC cho phép).

### 4.2 Cửa sổ phân loại quét (không phải “khóa sổ HEAD”)

Chỉ dùng để biết lần quét là IN hay OUT / từ chối khung nghỉ trưa — **không** dùng để khóa quyền HEAD hay gửi báo cáo.

| Tham số | Mặc định |
|---------|----------|
| `late_cutoff` | `07:00:00` |
| Cửa sổ IN | `05:30:00` – `11:00:00` |
| Cửa sổ OUT | `13:30:00` – `18:00:00` |
| 11:00–13:30 | Log `REJECTED` (không cập nhật summary) |

### 4.3 Tính `DI_LAM` / `DI_TRE` — phương án **C** (BẮT BUỘC)

Gọi `late_cutoff` = 07:00:00.

1. **Mọi lần quét IN hợp lệ đều ghi log.**
2. Các lần IN có `scanned_at.time <= late_cutoff`:  
   - `check_in_at` = **MAX** các lần này;  
   - `status` = **`DI_LAM`**.
3. Các lần IN có `scanned_at.time > late_cutoff`:  
   - **Luôn log**;  
   - Nếu **đã có** IN hiệu lực từ bước 2 (đã `DI_LAM`) → **không đổi** `check_in_at` / **không** đổi thành `DI_TRE`;  
   - Nếu **chưa có** IN trước/bằng cutoff → lần IN **đầu tiên** sau cutoff gán `check_in_at` = lần đó, `status` = **`DI_TRE`**; các lần IN sau cutoff tiếp theo chỉ log, **không** đổi `check_in_at`/`status` (đã khóa `DI_TRE`).

**Ví dụ**

| Quét IN | Kết quả |
|---------|---------|
| 06:40, 06:55 | `check_in_at=06:55`, `DI_LAM` |
| rồi 07:10 | Log thêm; **vẫn** `DI_LAM` / 06:55 (không bị đẩy đi trễ) |
| Chỉ 07:10 (chưa quét trước 7h) | `check_in_at=07:10`, `DI_TRE` |
| rồi 07:25 | Log; giữ `DI_TRE` / 07:10 |

### 4.4 OUT

- Trong cửa sổ OUT: **luôn** ghi `fingerprint_scan_logs`; `check_out_at` = **MAX** các lần OUT hợp lệ trên bản ghi ngày.
- **OUT khi chưa có bản ghi ngày / chưa có status có mặt (phương án A):**
  - **Tạo** (hoặc cập nhật) `attendance_records`: `check_out_at = scanned_at` (MAX), `check_in_at = null`, **`status = null`** (UI = **CHƯA CHẤM**), `source = FINGERPRINT`.
  - **Không** tự gán `DI_LAM` / `DI_TRE`. HEAD gán thủ công hoặc NV quét IN sau (trong cửa sổ IN) mới có status có mặt.
  - Log message: `Ra về (chưa có giờ vào)` — **không** còn nhánh “chỉ ghi log”.
- OUT khi đã có status khóa thủ công (`NGHI_PHEP` / …): vẫn `REJECTED` (§3.3).
- Không bắt buộc OUT để gửi báo cáo (chỉ cảnh báo UI nếu thiếu).
- Cột DB `attendance_records.status` **nullable** (Flyway) để hỗ trợ OUT-only.

### 4.5 Hợp lệ ngày / CompletionStatus / không nộp báo cáo khoa (P5 — bắt buộc)

**Mô hình:** exception-based. Scan → DB ngay. **Cấm** CTA / API bắt HEAD **Gửi báo cáo** mỗi ngày. Admin thấy dữ liệu **realtime** trên dashboard.

**Hợp lệ “đã chấm” (một NV trong ngày)** — dùng KPI / `markedCount` / hàng đợi (không còn cổng nộp):

| Loại | Điều kiện hợp lệ |
|------|------------------|
| Có mặt `DI_LAM` \| `DI_TRE` | Có **cả** `check_in_at` **và** `check_out_at` |
| Thủ công `NGHI_PHEP` \| `DI_HOC` \| `DI_CONG_TAC` \| `THAI_SAN` | Chỉ cần **status** (không bắt giờ vào/ra) |
| OUT-only / thiếu giờ / chưa record | **Chưa** hợp lệ → vào hàng đợi thiếu dữ liệu chấm công (§4.5.2) |

`COMPLETED` khi mọi NV active của đơn vị trong ngày đều hợp lệ — **chỉ** cho KPI/badge “đủ dữ liệu”, **không** khóa nút nộp (nút đã bỏ).

- Không phụ thuộc cửa sổ 06:00–16:00.
- `attendance_report_submissions` / `report-submit`: **deprecated** — không gate runtime; FE **không** hiện Gửi báo cáo. Bản ghi lịch sử cũ có thể giữ DB, không dùng để REJECTED scan / khóa HEAD.
- `reportBlocked` (nếu còn): chỉ nghĩa **Admin khóa chỉnh sửa HEAD** cho khoa/ngày (tùy chọn legacy) — **không** mang nghĩa “chưa nộp báo cáo”.

#### 4.5.1 Cảnh báo thiếu giờ ra (P3f — bắt buộc)

| Rule | Chi tiết |
|------|----------|
| Điều kiện | `status ∈ {DI_LAM, DI_TRE}` **và** có `check_in_at` **và** `check_out_at == null` |
| Mục đích | Giải thích badge có mặt nhưng KPI chưa đủ — **không** nới HEAD đè vân tay |
| UI | Hint VN trên HEAD Chấm công + Admin Chi tiết Đơn vị — ví dụ: `Thiếu giờ ra` |

#### 4.5.2 Hàng đợi thiếu dữ liệu chấm công (P5 — bắt buộc)

| Rule | Chi tiết |
|------|----------|
| Mục đích | Auto liệt kê bất thường — **không** bắt HEAD nộp báo cáo mới thấy |
| API | `GET /api/attendance/missing-punches?date=&deptCode=` — HEAD: luôn khoa mình; ADMIN: omit `deptCode` = toàn viện |
| `MISSING_CHECK_OUT` | `DI_LAM`\|`DI_TRE` + có vào + không ra |
| `UNMARKED` | NV active không hợp lệ §4.5 và **không** đang status thủ công vắng (gồm chưa record / OUT-only / thiếu dữ liệu) |
| Loại trừ | Đã `NGHI_PHEP`\|`DI_HOC`\|`DI_CONG_TAC`\|`THAI_SAN` → **không** vào queue “không quét” |
| UI | HEAD: panel/banner trên Chấm công; Admin: bảng/widget dashboard hoặc cùng API trên trang tiện ích |
| Xử lý | HEAD: gán ngoại lệ khoảng ngày (whitelist) nếu đúng; Admin: điền giờ trống (§4.6) / soft clear (§4.11) |

### 4.6 Admin điền giờ trống (phương án X)

| Rule | Chi tiết |
|------|----------|
| Ai | **Chỉ ADMIN** — HEAD **không** sửa giờ |
| Ô được sửa | Chỉ field **đang null** (`check_in_at` / `check_out_at`). **Cấm** ghi đè giờ đã có từ máy quét |
| API | `PUT /api/admin/attendance/times` body: `empCode`, `date`, `checkInTime?` (`HH:mm`), `checkOutTime?` (`HH:mm`) — ít nhất một ô trống được gửi |
| Status (X) | Đã có `DI_LAM`/`DI_TRE` → **giữ**. `status=null` và vừa có giờ vào → tự gán theo **rule C** (`late_cutoff` = `AttendanceValidity.LATE_CUTOFF` **07:00** — một nguồn hằng). Chỉ điền giờ ra, chưa có giờ vào → vẫn `status=null` |
| Can thiệp có mặt Admin | **Chỉ** kênh này (điền `check_in` trống → rule C) — **cấm** invent màn/API “đặt DI_LAM/DI_TRE không giờ” |
| Status thủ công vắng | **Không** bắt giờ; API từ chối điền giờ nếu đang `NGHI_PHEP`/… |
| Source | Nếu `source` trống → `ADMIN`; đã `FINGERPRINT` có thể giữ |
| Sau khóa mềm (§4.7) | Admin **vẫn được** điền ô trống |

#### UI modal (Admin Chi tiết Đơn vị — **Điền giờ** qua menu §10.6)

| Thành phần | Rule |
|------------|------|
| Trigger | Menu **Vân tay** → **Điền giờ** (chỉ hiện khi còn ô giờ trống và không đang status thủ công vắng) |
| FE | `FillAttendanceTimesModal.jsx` trên `DeptAttendanceDetailPage` |
| Asset | `frontend/src/assets/branding/biometrics.png` (copy từ Agent branding — **không** import path `fingerprint-agent/`) |
| Header | Title `Điền giờ vào / ra`; dòng NV: icon user + `{tên} • {empCodeFormatted}` |
| Hint | Banner `bg-primary-light` + **vạch trái primary** + icon info; copy §4.6 |
| Layout giờ | **Grid 2 cột** (`GIỜ VÀO` \| `GIỜ RA`); label + icon vào/ra |
| Ô đã có giờ | Input disabled; hiện `HH:mm` (24h); badge xanh **Đã có** **bên trong** ô (phải) |
| Ô trống | Input `type="time"` editable, viền `primary`, nền trắng, icon clock trong ô |
| Preview logic | Panel xám: header `XEM TRƯỚC LOGIC` + pill `TỰ ĐỘNG`; **ô vuông** ảnh `biometrics.png`; status + **progress bar** (rule C vs 07:00); caption giải thích. Giữ status nếu đã có; chưa có vào → CHƯA CHẤM |
| Footer | **Hủy** outline primary; **Lưu giờ** `btn-primary` + icon Save |
| Token | Semantic Tailwind — không hardcode hex |

- Chưa quét / chưa hợp lệ → HEAD gán thủ công vắng **hoặc** Admin bổ sung giờ thiếu (có mặt). Dữ liệu hiển thị Admin **realtime** — **không** chờ Gửi báo cáo.

### 4.7 Khóa mềm ngày công + bỏ nộp báo cáo khoa (P5 — bắt buộc)

**Cấm** dùng `attendance_report_submissions` / `POST …/report-submit` để khóa scan hoặc HEAD.

| Rule | Chi tiết |
|------|----------|
| Settings `lockTime` | **Giờ khóa mềm ngày công** (VN): sau giờ này (ngày hiện tại) HEAD **không** ghi Chấm công / manual-range cho hôm nay (trừ Admin unlock legacy nếu còn). **Không** mang nghĩa “HEAD phải nộp báo cáo trước giờ này” |
| Kiosk scan | **Không** REJECTED vì “đã gửi báo cáo”. Chỉ cửa sổ IN/OUT + rule chéo §3.3 |
| HEAD ghi | `assertCanWrite`: role + scope + **ngày hiện tại** + **chưa qua khóa mềm** (hoặc đã unlock Admin). Message VN khi khóa: `Đã qua giờ khóa mềm ngày công. Liên hệ Admin nếu cần chỉnh sửa.` |
| ADMIN | Vẫn fill / clear / manual-range đè theo §4.6–4.11 |
| `report-submit` | Deprecated — API có thể 410/no-op; FE **không** gọi, **không** nút |
| Bảng `attendance_report_submissions` | Chỉ lịch sử (nếu còn); **không** gate runtime |

### 4.8 HEAD whitelist PUT (P2.1h — bắt buộc)

| Rule | Chi tiết |
|------|----------|
| Status được gán | Chỉ `NGHI_PHEP` \| `DI_HOC` \| `DI_CONG_TAC` \| `THAI_SAN` |
| `DI_LAM` / `DI_TRE` | **Từ chối** — “Đi làm / Đi trễ chỉ ghi nhận qua vân tay.” |
| Đã có `DI_LAM`/`DI_TRE` trong ngày | **Từ chối** gán status khác — “Nhân viên đã Chấm công bằng vân tay. Không được gán trạng thái khác.” |
| `status=null` (OUT-only / chưa chấm) | HEAD được gán 4 status thủ công |
| FE | Quick-action **disabled** khi đã có `DI_LAM`/`DI_TRE`; StatusPicker AI chỉ 4 status thủ công |
| BE | Enforce trên `saveAttendance` + `previewBatchAttendance` / `confirmBatchAttendance` — không chỉ FE |

#### 4.8.1 Một semantics ghi thủ công — `applyManualStatus` (P3f — bắt buộc)

Mọi cổng gán 4 status thủ công **phải** dùng cùng semantics (tránh sót giờ quét còn sót trên bản ghi):

| Field | Giá trị |
|-------|---------|
| `status` | Status thủ công được gán |
| `source` | `MANUAL` |
| `check_in_at` / `check_out_at` | **null** (xóa) |
| `note` | Theo request (nếu có) |

| Cổng | Áp dụng |
|------|---------|
| `PUT /api/attendance/manual-range` | Mỗi ngày ghi |
| `saveAttendance` khi HEAD (và AI `confirmBatchAttendance`) | Sau whitelist / không đè presence |
| Single-day PUT từ FE quick-action | **Không** dùng — FE chỉ mở modal range; có thể deprecate dead path |

AI batch preview: nếu target OUT-only (có giờ, `status=null`), vẫn gán được; sau confirm giờ bị xóa theo bảng trên.

### 4.9 Khóa sổ giờ & settings (P5)

- **Không** dùng 06:00–lockTime để mô tả “HEAD gửi báo cáo”.
- `lockTime` = **khóa mềm** HEAD ghi ngày hôm nay (§4.7).
- `reminderTime` = phút chạy job nhắc theo **hàng đợi thiếu dữ liệu chấm công của ngày hôm qua** (D−1) — không copy “Hoàn thành trước 08:00 hôm nay”.
- FE HEAD: bỏ nút **Gửi báo cáo**; bảng disable khi `!editable` (không hôm nay / đã khóa mềm / reportBlocked legacy).
- Admin dashboard: bỏ phụ thuộc “Đã gửi báo cáo” để vận hành; ưu tiên KPI hợp lệ + missing-punches.

### 4.10 Rule C — một nguồn `late_cutoff` (P2.1h)

- Hằng `AttendanceValidity.LATE_CUTOFF = 07:00` (`Asia/Ho_Chi_Minh`).
- `FingerprintScanService` / Admin fill / FE preview modal **đọc cùng ngưỡng** (không nhân bản hằng lệch nhau).

### 4.11 Admin soft clear → “chưa chấm” (P3f — bắt buộc)

Can thiệp đặc biệt khi cần hủy status/giờ ngày (sai sót, đè sau submit, v.v.) — **không** xóa lịch sử quét.

| Rule | Chi tiết |
|------|----------|
| Ai | **Chỉ ADMIN** — HEAD **403** |
| Soft clear | `status = null`; `check_in_at = null`; `check_out_at = null`; `source = ADMIN` |
| Lý do | Body **`reason` bắt buộc** (`@NotBlank`, max 255) → lưu vào `attendance_records.note` |
| Log quét | **Không** xóa / sửa `fingerprint_scan_logs` (append-only) |
| Sau khóa mềm | **Được** clear |
| Hậu quả | Không còn gate “đã gửi báo cáo” cho kiosk; roster incomplete → hàng đợi §4.5.2 |
| Bản ghi đã trống | `status==null` và không có giờ vào/ra → BusinessException VN: đã ở trạng thái chưa chấm |
| Không có bản ghi ngày | BusinessException — không tạo record rỗng chỉ để clear |
| API | `POST /api/admin/attendance/clear` body: `empCode`, `date?` (mặc định hôm nay), `reason` |
| Response | `StaffAttendanceDto` sau clear |
| UI | Chi tiết Đơn vị: mục **Đưa về chưa chấm** trong menu **Vân tay** (§10.6); `FormModal` + ô lý do |
| UI khi ngày đã submit | Banner **warning** VN: đã gửi báo cáo — clear **không** hủy submit; kiosk vẫn từ chối scan; quân số ngày có thể lệch báo cáo đã nộp |

---

## 5. Data model — một nguồn cho mọi màn

**Bắt buộc:** Chấm công HEAD, thống kê, Dashboard Admin (KPI/donut), Excel, báo cáo, AI đọc trạng thái → **cùng schema / cùng query nguồn**. Không bảng song song lệch nhau.

### 5.1 `employee_fingerprints`

Template đăng ký: `emp_code`, `finger_index`, `template`, `template_len`, `zk_fid`, `active`, `enrolled_at`, `enrolled_by`, **`finger_label`** (P2.2).

#### `finger_label` — ghi chú ngón tay (P2.2 — bắt buộc)

| Rule | Chi tiết |
|------|----------|
| Model | **1 template active / NV** (`zk_fid = emp_code` giữ nguyên) |
| Auth Agent | **Kiosk token + PIN** — **không** login HEAD/Admin trên Agent |
| Cột DB | `finger_label` VARCHAR(100) — bắt buộc khi enroll mới (active) |
| Enroll body | `fingerLabel` `@NotBlank`, trim, max 100 — message VN nếu trống |
| Backfill | Bản ghi active cũ: `Chưa ghi chú` (Flyway V15) |
| ĐK lại (R1) | NV đã ĐK → **Bắt đầu đăng ký** → confirm ghi đè VN → 3 lần quét → dialog label mới → POST (deactivate cũ + lưu mới) |
| Xóa trên Agent | `DELETE /api/kiosk/fingerprints/{empCode}` — soft-delete active; scope khoa token; confirm VN |
| Xóa / enroll trên Web | **Cấm** — HEAD và ADMIN **không** `DELETE`/`POST enroll` template qua session Web (chốt A). Web chỉ GET trạng thái + `fingerLabel` |
| List kiosk staff | `GET /api/kiosk/staff` trả `fingerLabel` khi `fingerprintRegistered` |
| Cấm phase này | Nhiều ngón active đồng thời; login session trên Agent; xóa/enroll template từ browser |

#### `zk_fid` — định danh SDK (P2.1a — bắt buộc)

| Rule | Chi tiết |
|------|----------|
| Giá trị | **`zk_fid = emp_code`** (INT, unique theo NV trong khoa / toàn DB active) |
| Cấm | Bộ đếm local Agent (`nextFid` reset về 1 mỗi lần mở app) — gây **nhiều `emp_code` cùng một `zk_fid`** → `DBAdd` Identify chỉ nạp được vài mẫu |
| Enroll | Agent POST enroll với `zkFid = empCode`; BE lưu đúng field đó (có thể ghi đè request sai về `empCode`) |
| Identify load | Agent `DBAdd(mhDB, empCode, blob)` — **không** dùng FID trùng; map `fid → TemplateItem` theo `empCode` |
| Migration | `UPDATE employee_fingerprints SET zk_fid = emp_code` (Flyway V10) — không cần đăng ký lại nếu template còn |
| Banner nạp mẫu | Hiện `Đã nạp {loaded}/{total} mẫu…`; nếu `loaded < total` → WARNING + ghi log console lý do skip |

### 5.2 `fingerprint_scan_logs`

Mọi lần quét: `emp_code`, `dept_code`, `scanned_at`, `direction` (`IN`|`OUT`|`REJECTED`), `score`, `message`, `created_at`. Append-only.

### 5.3 Bản ghi ngày (mở rộng `attendance_records` hoặc bảng day-presence **map 1–1** rồi deprecate nguồn cũ)

Mỗi `(emp_code, attendance_date)`:

| Field | Ý nghĩa |
|-------|---------|
| `status` | `DI_LAM` \| `DI_TRE` \| thủ công \| null |
| `check_in_at` | IN hiệu lực (rule C) |
| `check_out_at` | OUT MAX |
| `source` | `FINGERPRINT` \| `MANUAL` \| `ADMIN` |
| `note` | Tùy chọn |

Migration: cập nhật mọi reader (page/summary/stats/dashboard) sang nguồn này trong cùng phase dữ liệu.

### 5.4 Khoảng ngày thủ công

Bảng hoặc cơ chế ghi nhận `from_date`–`to_date` + status + emp; expand thành bản ghi ngày (5.3) cho từng ngày trong khoảng.

---

## 6. Auth Agent vs Web (không nhầm `assertCanWrite` khóa sổ)

| | Web HEAD | Agent scan |
|--|----------|------------|
| Auth | Session cookie HEAD | **Token kiosk** gắn `deptCode` (+ LAN) |
| Ghi nhận | `updated_by` = account HEAD (thủ công / báo cáo) | `submitted_by` / actor = **kiosk hệ thống khoa**, không phải “HEAD bấm trong khung giờ” |
| Rule ghi | Whitelist status thủ công (§4.8); không sửa scan; khóa sau submit (§4.7) | Rule IN/OUT + C + khóa chéo mục 3.3 + khóa sau submit (§4.7) |
| Khóa sổ 06:00–16:00 | **Không áp dụng** (§4.9) | **Không áp dụng** |

---

## 7. Head AI — tắt batch DI_LAM (chống lách SPEC)

Khi bật mô hình vân tay:

1. **Cấm** batch / tool gán `DI_LAM` / `DI_TRE` (BE reject + intent “đi làm” không mở preview).  
2. Endpoint `POST /api/head/ai/tools/confirm-batch-attendance` (và preview/execute): nếu `status` là `DI_LAM`/`DI_TRE` → **từ chối** message VN: “Đi làm / Đi trễ chỉ ghi nhận qua vân tay.”  
3. Quick action **Chấm công hàng loạt** vẫn mở **StatusPicker** — **chỉ 4 status thủ công** (không hiện Đi làm / Đi trễ).  
4. Batch thủ công vẫn tôn trọng §4.7 (sau submit) và §4.8 (không đè `DI_LAM`/`DI_TRE` đã có).  
5. Không tự invent tool mới thay thế ngoài SPEC.

---

## 8. Mạng & bảo mật

| Môi trường | Enroll / raw template / POST scan | Web |
|------------|-----------------------------------|-----|
| LAN / loopback (allowlist CIDR) | Được + auth token | Đầy đủ theo quyền |
| Tailscale / public / IP ngoài allowlist | **403** toàn bộ `/api/kiosk/**` | Web session bình thường; **không** raw template |

### 8.1 LAN gate kiosk (**P4b** — bắt buộc khi deploy)

**Mục đích:** token kiosk = quyền ghi biometric cả khoa (~20–30 NV × ~32 khoa). API kiosk **không** được gọi từ Internet / Tunnel public.

| Rule | Chi tiết |
|------|----------|
| Filter | `KioskLanGateFilter` trước/cùng chuỗi với `KioskTokenFilter` — path `/api/kiosk/**` |
| Cấu hình | `app.security.kiosk.lan-gate-enabled` + `app.security.kiosk.allowed-cidrs` |
| Prod | **`lan-gate-enabled=true`** — mặc định CIDR: `127.0.0.1/32`, `::1/128`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (ops mở rộng qua env nếu LAN khác) |
| Local | **`lan-gate-enabled=false`** (dev tiện); bật `true` khi test giống prod |
| Từ chối | HTTP **403** JSON `{"message":"API kiosk chỉ dùng trên mạng nội bộ."}` — **không** lộ chi tiết IP |
| Forwarded | Mặc định dùng `request.getRemoteAddr()`. Chỉ đọc `X-Forwarded-For` (hop đầu) khi `app.security.kiosk.trust-forwarded-headers=true` (sau reverse proxy tin cậy) |
| Cấm | Để Tunnel Cloudflare expose `/api/kiosk/**` mà không chặn ở edge **và** không bật LAN gate |

### 8.2 Scan clock + debounce server (**P4b**)

| Rule | Chi tiết |
|------|----------|
| `scannedAt` client | **Bỏ qua** — server luôn dùng `Instant.now()` (Asia/Ho_Chi_Minh day/window). Field body vẫn nhận (compat) nhưng **không** tin để Rule C / IN-OUT |
| Debounce server | ≥ **2 giây** giữa hai lần POST scan **thành công hoặc đang xử lý** cùng `(deptCode, empCode)` → `REJECTED` message VN `Vừa ghi nhận — chờ giây lát.` (vẫn ghi log REJECTED) |
| Debounce Agent | Giữ ≥ 2s + **in-flight** (không POST chồng khi request chưa xong) — §9.3.3 |
| Race tạo bản ghi ngày | Unique `(attendance_date, emp_code)` → bắt conflict → **đọc lại + cập nhật** (không 500; không lệch Web) |

### 8.3 Token khoa (**P4b**)

| Rule | Chi tiết |
|------|----------|
| Một token active / khoa | `POST` phát hành mới → **thu hồi** mọi token active cùng `deptCode` (xóa plaintext + PIN cũ) rồi tạo bản ghi mới. Rotate giữ hành vi tương tự |
| Staff list kiosk | `GET /api/kiosk/staff` **không** load cột `template_base64` (chỉ meta: registered + `fingerLabel`) — tránh payload/LOB lệch chậm |

Lớp còn lại: auth bắt buộc; scope khoa; audit log quét; PIN enroll chỉ Agent UX (API vẫn token — dựa LAN gate).

---

## 9. Java Agent

- Main class vận hành P1: `com.bv87.fingerprint.agent.FingerprintAgentApp` (fork Demo2; `ZKFPDemo` chỉ tham chiếu).  
- Auth: **token kiosk** (`X-Kiosk-Token`) — **không** đăng nhập session Admin/HEAD trên Agent.  
- Identify liên tục trong giờ làm (P2+); mutex với mode Enroll.  
- Load template / danh sách NV **theo khoa** của token.  
- POST `{ empCode, score }` (không cần `scannedAt`) → server gán direction + rule C bằng **giờ server** (P2 + P4b).  
- Quy mô mục tiêu: **~32 khoa × 20–30 NV** — Identify local theo khoa; không load toàn viện.

### 9.3 Agent UX — mode Chấm công ngày / Identify (P2 binding)

**Mục đích:** NV đặt **một lần** ngón mỗi lần vào/ra; Agent nhận diện local → POST scan.  
**Mặc định khi mở Agent trên máy khoa:** mode **Chấm công** (Identify). Mode **ĐĂNG KÝ** (Enroll §9.1) chỉ khi ops/Admin chuyển mode.

#### Chuyển mode (mutex)

| Mode | UI chính | Quét |
|------|----------|------|
| **Chấm công** | Màn lớn: chờ đặt ngón; hiện kết quả tên / hướng / status | 1 lần → `DBIdentify` → POST scan |
| **ĐĂNG KÝ** | UI §9.1 (chọn NV, 3 lần quét) | Tạm **dừng** Identify |

- Chuyển sang ĐĂNG KÝ: dừng Identify loop.  
- Xong enroll / về Chấm công: **reload template khoa** → Identify lại.  
- Window title mode Chấm công: `Biometric Attendance` (tách khỏi Enroll). App brand có thể giữ `VÂN TAY NHÂN VIÊN` hoặc phụ đề “Chấm công”.

#### Preview khi đổi mode (**P4b** — bắt buộc)

| Trigger | Preview (`previewLabel`) | Ghi chú |
|---------|--------------------------|---------|
| Enroll → Chấm công (nút / idle) | `resetPreviewEmpty()` — icon null + text `Chờ đặt ngón tay…` | **Cấm** giữ ảnh vừa quét enroll |
| Chấm công → Enroll (sau PIN OK) | `resetPreviewEmpty()` | Không mang ảnh Identify cũ |
| Hủy enroll / xong enroll (trước đổi mode) | `resetPreviewEmpty()` | Tránh lệch UI |

#### 9.3.3 Agent không đơ EDT (**P4b** + **P4c**)

**Vấn đề:** POST scan / tải template / mở máy / enroll trên Swing EDT → UI đơ khi mạng/USB chậm; NV tưởng máy hỏng; queue quét lệch banner.

| Rule | Chi tiết |
|------|----------|
| Thread | Capture SDK nền (`WorkThread`); **HTTP** (`scan`, `listTemplates`, `listStaff`, `enroll`, `delete`) **không** block EDT — `Executor` + `invokeLater` chỉ cập nhật UI |
| In-flight scan | Một POST scan tại một thời điểm; quét thêm khi đang POST → banner WARNING, **không** gọi API |
| Debounce stamp | Ghi `lastScanPostMs` **trước** khi gọi API (không chỉ sau success) |
| Timeout HTTP scan | Connect ≤ **5s**, read ≤ **8s** (Agent `AppApiClient`) |
| Mở/đóng thiết bị (**P4c**) | `Init` / `OpenDevice` / `DBInit` / `Close` / `Terminate` trên **worker**; EDT chỉ gán handle + pill Máy / banner. Mutex `deviceOpInFlight` — không double-open |
| Enroll / xóa HTTP (**P4c**) | Sau dialog PIN/label/confirm trên EDT → `POST enroll` / `DELETE` trên worker; banner/dialog kết quả `invokeLater` |
| Preview ảnh (**P4c**) | Decode buffer xám → `BufferedImage` **in-memory** — **cấm** phụ thuộc ghi `fingerprint.bmp` vào CWD (Startup/Task Scheduler dễ fail / lệch UI) |

#### 9.3.2 Khóa mode Đăng ký — PIN + idle auto-back (P2.1d)

**Vấn đề:** Máy khoa / máy trưởng khoa chạy Agent cả ngày; NV có thể bấm **Đăng ký vân tay** và ghi đè mẫu / dừng Chấm công.

| Rule | Chi tiết |
|------|----------|
| Vào **Đăng ký** từ Chấm công | Bắt buộc nhập **PIN ops** đúng mới `switchToEnroll` |
| Về **Chấm công** từ Đăng ký | **Không** hỏi PIN (nút “Chấm công” hoặc idle timeout) |
| PIN cấu hình | `agent.properties`: `enroll.pin=…` (plaintext local trên PC khoa; ops đặt). **Trống / thiếu** → **không** cho vào Đăng ký; banner/dialog hướng dẫn cấu hình |
| Sai PIN / hủy dialog | Ở lại Chấm công; banner WARNING |
| Idle dialog PIN | Dialog nhập PIN (vẫn mode Chấm công): không thao tác trong `enroll.pinIdleSeconds` (mặc định **60**) → **tự đóng** dialog, ở lại Chấm công; banner WARNING |
| Idle auto-back (mode Đăng ký) | Đã vào Đăng ký: không thao tác trong `enroll.idleSeconds` (mặc định **120**) → hủy enroll (nếu có) + về Chấm công + reload Identify |
| Activity reset idle | Dialog PIN: gõ/chuột trong dialog. Mode Đăng ký: click/chuột/phím, combo NV, Bắt đầu/Hủy, quét enroll, Tải DS |
| UI dialog PIN | **Không** dùng `JOptionPane` block không timeout — dùng `JDialog` modal tùy chỉnh + timer idle; tiêu đề `Xác nhận Đăng ký`; ô mật khẩu ẩn |
| Cấm | Login session Admin/HEAD trên Agent; để nút Đăng ký mở không PIN |

#### Layout mode Chấm công (ASCII)

```
[title bar] Biometric Attendance
[logo] VÂN TAY NHÂN VIÊN — Chấm công     [pill Máy: …]  [Đăng ký vân tay]
Đơn vị: {deptName}
        ┌──── content ≤960px (centered) ────┐
        │ Kết quả (1 dòng phía trên preview)│
        │ ┌─ vùng quét ───────────────────┐ │
        │ │ preview / Chờ đặt ngón tay…   │ │
        │ └───────────────────────────────┘ │
        │ [ Kết nối thiết bị ] [ Ngắt kết nối ] │
        └───────────────────────────────────┘
```

#### 9.3.1 Feedback NV + layout desktop (P2.1b)

**Mục đích:** NV đứng máy nghe/thấy rõ kết quả; màn maximize không kéo loãng.

##### Kết quả Identify (1 dòng — không tách banner / tên / badge)

Sau POST scan OK (hoặc REJECTED có NV): **một** dòng trên vùng banner (phía trên preview), format:

`{empCodeFormatted} - {name} - {STATUS}`

| `direction` API | Điều kiện | `{STATUS}` (uppercase) | Banner tone | Âm |
|-----------------|-----------|------------------------|-------------|-----|
| `IN` | — | **`VÀO THÀNH CÔNG`** | SUCCESS | success |
| `OUT` | Đã có `check_in_at` (status có mặt) | **`RA THÀNH CÔNG`** | SUCCESS | success |
| `OUT` | OUT-only (`status` null / chưa có giờ vào) | **`RA — CHƯA CÓ GIỜ VÀO`** | WARNING | fail |
| `REJECTED` | Có `message` từ BE (B1 / P4a) | **`TỪ CHỐI — {message}`** (rút gọn 1 dòng nếu dài) | WARNING | fail |
| `REJECTED` | `message` trống | **`TỪ CHỐI`** | WARNING | fail |

- **IN/OUT thành công:** **không** ghép thêm message API kiểu “Đã ghi nhận ra.”  
- **REJECTED:** **bắt buộc** hiện `message` BE khi có (vd. `Đã gửi báo cáo.`, `Ngoài khung giờ vào/ra…`) — vẫn **một** dòng banner.  
- **Không** hàng meta `{name} {code}` + pill badge dưới preview (mode Chấm công).  
- **Không** rút STATUS thành công còn `VÀO` / `RA`.  
- Identify/API fail (chưa gắn NV ổn định): **một** dòng banner tiếng Việt (vd. `Không nhận diện được…` / `… - LỖI` + message nếu có) — **không** badge meta riêng.  
- Hàng meta + badge dưới preview chỉ dùng mode **Đăng ký** (MÃ + ĐANG QUÉT / THÀNH CÔNG).  
- Web modal Chi tiết quét (`Vào`/`Ra`) **không** đổi theo rule này.

##### Âm thanh kiosk (P2.1b / P2.1c)

Kiểu **chime / buzz kiosk** (giống máy chấm công), **không** dùng sine “tít tít thử nghiệm” làm âm chính.

| Sự kiện | Âm UI | File classpath |
|---------|-------|----------------|
| POST scan OK (`IN` / `OUT`) | Chime ngắn lên cao (ding 1–2 nốt) | `/sounds/scan-success.wav` |
| Identify fail, API fail, `REJECTED` | Buzz / nốt thấp đi xuống | `/sounds/scan-fail.wav` |
| Debounce “vừa ghi nhận” | **Không** phát âm (chỉ banner WARNING) | — |

Rule kỹ thuật:
- Phát trên Agent JVM; không phụ thuộc Web.
- `agent.properties`: `sound.enabled=true` (mặc định). `false` / `0` → tắt.
- Play trên thread nền; không block EDT lâu.
- **Ưu tiên:** phát WAV 16-bit PCM mono **44100 Hz** từ classpath (`src/sounds/…`, giống branding).
- **Fallback 1:** nếu thiếu file / Clip lỗi → melody PCM ngắn (success lên cao / fail xuống thấp), 44100 Hz.
- **Fallback 2:** nếu line audio lỗi → `Toolkit.getDefaultToolkit().beep()` (success 2 nhịp / fail 3 nhịp).
- Log stderr: `[FingerprintAgent] beep failed: …` — không chặn UI.
- **Cấm** lấy âm từ mạng / CDN lúc runtime.

##### Layout desktop

| Hạng mục | Rule |
|----------|------|
| Cột nội dung | Max-width **≤960px**, **căn giữa** cửa sổ |
| Kết quả Chấm công | **1 dòng** banner phía trên preview (`mã - tên - STATUS`); **ẩn** hàng meta dưới preview |
| Meta Đăng ký | Hàng `MÃ:` + badge phiên quét dưới preview — chỉ mode Enroll |
| Nút Kết nối / Ngắt | Cùng hàng, cùng chiều cao/độ rộng (`GridLayout 1×2`) trong cột max-width |
| Gap | Giữ `SECTION_GAP`; ưu tiên top-aligned + cột hẹp (không stretch full width) |

#### API kiosk (P2)

| Method | Path | Việc |
|--------|------|------|
| GET | `/api/kiosk/fingerprints/templates` | Template **active** khoa token: `empCode`, `fullname`, `zkFid` (**= empCode**, P2.1a), `templateBase64`, `templateLen` — **chỉ** Agent kiosk (LAN) |
| POST | `/api/kiosk/fingerprints/scan` | Body: `empCode`, `score` (`scannedAt?` **ignored** P4b) → direction + rule C + log theo **giờ server** |

Response scan (rút gọn): `direction`, `status` (nếu cập nhật summary), `fullname`, `empCodeFormatted`, `checkInAt`, `checkOutAt`, `message` (VN).

#### Hành vi server (tóm tắt §4)

1. Ghi `fingerprint_scan_logs` mọi lần (IN / OUT / REJECTED).  
2. Phân cửa sổ IN/OUT / nghỉ trưa (§4.2) theo **giờ server**.  
3. IN → rule **C** (§4.3) cập nhật `attendance_records` (`status` `DI_LAM`/`DI_TRE`, `check_in_at`, `source=FINGERPRINT`).  
4. OUT → `check_out_at` = MAX trên bản ghi ngày; **OUT-only** tạo bản ghi `status=null` (§4.4 phương án A); không đổi status có mặt đã có.  
5. Khóa chéo §3.3: đã thủ công nghỉ/học/công tác/thai sản → log REJECTED, không đổi summary.  
6. Debounce Agent **và** server: ≥ 2s cùng `empCode` (P4b); race unique → upsert (§8.2).

#### Ngoài phạm vi slice P2.1 (làm phase sau nếu cần)

- Đồng bộ đầy đủ Web HEAD cột giờ vào/ra / badge DI_TRE trên mọi màn (P3 — phần lớn đã P3a+).  
- ~~Windows Service autostart (P4).~~ → **P4a** Startup; **P4b** LAN gate; **P4c** Agent không đơ.  
- **P4 (đã chốt):** dist JAR + heartbeat Online + **watchdog** (không Service UI) — §9.5.  
- Verify By Image.

#### 9.4 Agent ops — auto-open thiết bị + autostart OS (P4a — bắt buộc)

**Mục đích:** giảm thao tác mỗi sáng — mở Agent là sẵn sàng Chấm công nếu USB ZK9500 đã cắm.

| Rule | Chi tiết |
|------|----------|
| `device.autoOpen` | `agent.properties` — mặc định **`true`**. Sau `bootstrapApi` OK → tự gọi mở ZK9500 (cùng logic nút **Kết nối thiết bị**) |
| Retry | `device.autoOpenRetries` (mặc định **3**), khoảng `device.autoOpenRetryMs` (mặc định **2000**). Hết lần vẫn fail → banner VN + nút **Kết nối thiết bị** thủ công |
| Tắt auto | `device.autoOpen=false` — chỉ mở máy bằng nút (dev / máy không gắn ZK) |
| Autostart OS | Cài **một lần** trên PC khoa: Windows **Startup** → `scripts/start-agent-silent.vbs` (`wscript //B` → `javaw`) — xem `fingerprint-agent/README.md`. Debug tay: `start-agent.bat` (có console) |
| Classpath (`start-agent.bat`) | Working dir = `fingerprint-agent/`. Marker file: `com\bv87\fingerprint\agent\FingerprintAgentApp.class`. Tìm **theo thứ tự**: (1) `classes\production\ZKFinger Demo2` (**output IntelliJ hiện tại** — compiler output dir = `classes`), (2) `classes\production\fingerprint-agent`, (3) quét `classes\production\*`, (4) `out\production\fingerprint-agent`, (5) `out\production\ZKFinger Demo2`, (6) quét `out\production\*`, (7) `out\` (flat, nếu có `com\bv87\…` trực tiếp), (8) `target\classes`. Không tìm thấy → lỗi VN + liệt kê path đã thử |
| Native / `-cp` | `-cp` = `{classesDir};lib\*` ; `-Djava.library.path` = **`{abs}\lib` + `%SystemRoot%\System32`** (và/hoặc `%PATH%`) — **cấm** chỉ `lib` nếu `lib` không có `libzkfp.dll` (che System32 → `UnsatisfiedLinkError`) |
| Preflight DLL (**P4b**) | Trước `java`: nếu không thấy `libzkfp.dll` trong `lib\` **và** không thấy `%SystemRoot%\System32\libzkfp.dll` → echo lỗi VN, `exit /b 1` (không mở UI rồi crash) |
| Điều kiện trước Startup | Build/Run `FingerprintAgentApp` trong IntelliJ **ít nhất một lần** để có class dưới `classes\production\<ModuleName>\` (không nhầm chỉ có `ZKFPDemo` dưới `out\`) |
| Chuẩn hóa tên module (khuyến nghị) | Đổi module IntelliJ → `fingerprint-agent` rồi Rebuild — bat vẫn giữ fallback `ZKFinger Demo2` |
| Phạm vi P4a | Autostart + auto-open + runbook + bat classpath đúng IDE |
| Phạm vi P4b (ops/secure) | LAN gate §8.1; native path + preflight; preview reset; Agent I/O off EDT; scan server clock + debounce + upsert; staff không LOB; 1 token active/khoa |
| Phạm vi P4c (Agent UX/perf) | `openDevice`/`closeDevice` off EDT; enroll/delete HTTP off EDT; preview in-memory; IntelliJ VM options = bat (`java.library.path`) |
| IntelliJ Run config (**P4c**) | Working directory = `fingerprint-agent`. VM options: `-Dfile.encoding=UTF-8 -Djava.library.path=lib;%SystemRoot%\System32` (Windows). Main = `FingerprintAgentApp` — **parity** với `start-agent.bat` |

#### 9.5 P4 ops — dist JAR + heartbeat Online + watchdog (đã chốt)

**Mục tiêu vận hành (~32 khoa):**  
1. User mở máy / vào Windows → Agent **bật sẵn** (Startup — P4a).  
2. Agent **crash giữa giờ** → **tự mở lại** (watchdog).  
3. Admin Web thấy **Online / Offline** theo token khoa (heartbeat).  
4. Cài máy khoa **không cần IntelliJ** (dist JAR).

##### 9.5.1 Phân phối JAR (thay phụ thuộc `classes\production`)

| Rule | Chi tiết |
|------|----------|
| Build | Script `fingerprint-agent/scripts/build-agent-jar.ps1` → `dist/fingerprint-agent.jar` (classes app + resources branding/sounds) |
| Runtime CP | `-cp dist\fingerprint-agent.jar;lib\*` + `-Djava.library.path` như §9.4 |
| `start-agent.bat` | **Debug / IT:** ưu tiên `dist\fingerprint-agent.jar`; có console. Ops user: `start-agent-silent.ps1` (§9.5.3) |
| Cài PC khoa | Copy thư mục agent (`dist\`, `lib\`, `scripts\`, `agent.properties`) — **cấm** yêu cầu IntelliJ trên máy khoa |
| jpackage / .exe | **Không** bắt buộc phase này (có thể sau) |

##### 9.5.2 Heartbeat Agent Online

| Rule | Chi tiết |
|------|----------|
| API | `POST /api/kiosk/heartbeat` — auth `X-Kiosk-Token`; cập nhật `fingerprint_kiosk_tokens.last_heartbeat_at = now` cho token **active** đang auth |
| Agent | Sau bootstrap OK: gửi heartbeat ngay + định kỳ `heartbeat.intervalSeconds` (mặc định **30**). `heartbeat.enabled=false` → tắt |
| Thread | Heartbeat HTTP trên worker (không block EDT) |
| DB | Cột `last_heartbeat_at` DATETIME(6) NULL — Flyway V16 + entity |
| Admin DTO | `lastHeartbeatAt`, `agentOnline` — `true` khi active **và** `now - lastHeartbeatAt ≤ onlineThresholdSeconds` (mặc định **90**) |
| Admin UI | Cài đặt → Quản lý token vân tay: cột **Agent** — pill `Online` (`badge-success`) / `Offline` (`badge-neutral` hoặc danger soft). Thu hồi → Offline. Poll list mỗi **60s** khi trang mở |
| Cấm | Dùng heartbeat thay watchdog tại máy; trả `token_hash` |

##### 9.5.3 Watchdog (không Windows Service UI)

**Chốt sản phẩm:** **Không** cài Windows Service mở Swing (session 0 isolation).  

| Rule | Chi tiết |
|------|----------|
| Logon | P4a: Startup shortcut → `scripts/start-agent-silent.vbs` → `start-agent-silent.ps1` (`javaw`, ẩn CMD/PowerShell) |
| Crash recovery | Task Scheduler (user hiện tại) mỗi **2 phút** chạy `scripts/watchdog-agent.vbs` (`wscript //B`, cửa sổ **0**) → `watchdog-agent.ps1`. **Cấm** task Action trực tiếp `powershell.exe` (nhấp nháy màn hình dù `-WindowStyle Hidden`) |
| Alive detect | Shared `scripts/agent-process.ps1`: (1) PID file `logs/agent.pid` + process `java`/`javaw` còn sống; (2) fallback cmdline chứa `FingerprintAgentApp` hoặc `fingerprint-agent.jar`. **Không** chỉ dựa cmdline (hay `null` → spam start) |
| PID file | Silent start ghi PID sau verify OK; watchdog/silent **không** start thêm nếu PID còn sống. PID chết → xóa file rồi mới start |
| Console UX | Autostart + watchdog **cấm** cửa sổ `cmd`/console PowerShell cho user. IT debug: `scripts/start-agent.bat` |
| Silent `java.library.path` | Chỉ `{agentRoot}\lib` + `%SystemRoot%\System32` — **cấm** nối nguyên `%PATH%` |
| Silent launch API | `ProcessStartInfo` + một chuỗi `Arguments` đã quote — **cấm** `Start-Process -ArgumentList @(…)` với path có space |
| Silent verify | Sau start: chờ ~2s; process còn → ghi `logs/agent.pid` + log OK; chết ngay → log lỗi, `exit 1` |
| Silent fail log | `fingerprint-agent/logs/silent-start.log` |
| Cài một lần | **Chạy lại** `install-watchdog.ps1` (+ `install-autostart.ps1`). Script **bỏ qua** lỗi `schtasks /Delete` khi task đã bị xóa tay. Nếu `Access is denied` khi **tạo**: PowerShell **Run as administrator**, hoặc xóa task cũ trong Task Scheduler rồi chạy lại |
| Trùng instance | Watchdog **không** mở thêm nếu Agent alive (PID hoặc cmdline) |
| Cấm | Service SYSTEM mở `JFrame`; Services.msc; Startup/watchdog trỏ `start-agent.bat` hoặc `powershell.exe` trực tiếp |

##### 9.5.4 Ngoài phạm vi P4 này

- Export Excel/scan nâng cao (nếu cần — ticket riêng).  
- Windows Service interactive / session 0 UI.  
- jpackage MSI (tùy chọn sau khi dist JAR ổn).

---

**Mục đích màn:** đăng ký / đăng ký lại vân tay cho NV thuộc đơn vị kiosk.  
**Không** hiện chức năng dev Demo2: Verify, Register/Verify By Image.  
**Không** bắt buộc nút “Lưu/OK” thủ công sau lần quét 3 — Agent **tự POST** enroll.

#### Tiêu đề & thông tin đơn vị

| UI | Giá trị |
|----|---------|
| Window title (`setTitle`) | Cố định **`Biometric Enroll`** — xem **P1.1h** |
| Hàng đầu trong app | Logo local + chữ **`VÂN TAY NHÂN VIÊN`** (tách khỏi window title) — xem **P1.1h** |
| Dòng đơn vị | Tên từ API: `{deptName}` (vd. `Kế hoạch - Tổng hợp`) — **cấm** chữ “kiosk” trên UI người dùng |
| Trạng thái máy | Đã kết nối / Chưa kết nối / Lỗi USB (rút gọn; có thể ẩn Open/Close khỏi luồng chính hoặc gộp một nút “Kết nối thiết bị”) |

> **P1.1d / P1.1h:** Không dùng `ĐĂNG KÝ VÂN TAY NHÂN VIÊN` / `Bệnh viện Quân y 87` làm window title. Window = `Biometric Enroll`; body title = `VÂN TAY NHÂN VIÊN`.

#### Chỉ số & bộ lọc nhân viên

Nguồn: `GET /api/kiosk/staff` (toàn bộ NV active của khoa token).

| Chỉ số (luôn theo **cả khoa**, không theo lọc) | Ý nghĩa | Màu chữ (Agent) |
|-----------------------------------------------|---------|-----------------|
| Tổng | Số NV active khoa | **Navy/đen `#001A4D`** (P1.1f — không primary) |
| Đã đăng ký | `fingerprintRegistered = true` | Primary `#2563EB` |
| Chưa đăng ký | `fingerprintRegistered = false` | **Danger / cảnh báo `#EF4444`** — cả cụm `Chưa đăng ký: {n}` phải đỏ để nổi bật số còn thiếu (P1.1e) |

> **P1.1e (senior UX):** Trên màn enroll Agent, chỉ số **Chưa đăng ký: n** dùng màu đỏ cảnh báo (`#EF4444`, token `danger` / `DANGER`). **Không** để cùng màu primary với Tổng / Đã đăng ký. Khi `n = 0` vẫn giữ đỏ (đồng nhất; không đổi sang muted).  
> **P1.1f:** `Tổng: n` đổi sang **`#001A4D`** (navy) — tách khỏi primary xanh.

| Lọc danh sách chọn NV | Rule |
|----------------------|------|
| Tất cả | Hiện mọi NV khoa |
| Chưa đăng ký | Chỉ NV chưa có template active — **mặc định** khi mở màn enroll |
| Đã đăng ký | Chỉ NV đã ĐK (để đăng ký lại / ghi đè theo P1) |

Lọc thực hiện trên Agent (client-side). Cho phép ô tìm theo tên/mã (tuỳ implement, không bắt buộc phase này).

#### Luồng enroll (P2.2)

1. Kết nối thiết bị ZK9500.  
2. Tải / làm mới DS NV; áp dụng lọc.  
3. Chọn NV → **Bắt đầu đăng ký**:
   - NV **chưa ĐK**: vào quét ngay.  
   - NV **đã ĐK (R1)**: dialog confirm VN ghi đè mẫu hiện tại (hiện `fingerLabel` cũ nếu có) → OK mới `registering=true`.  
4. Quét **3 lần cùng một ngón**.  
5. Sau lần 3: `DBMerge` → **dialog bắt buộc** nhập `fingerLabel` (text VN, 1–100 ký tự) → POST `/api/kiosk/fingerprints/enroll` (kèm `fingerLabel`) → cập nhật list.  
6. **Thông báo thành công** — reload list trước, rồi success (có label).  
7. **Xóa vân tay**: chọn NV đã ĐK → nút **Xóa vân tay** (enable khi đã ĐK + không đang enroll) → confirm → `DELETE /api/kiosk/fingerprints/{empCode}` → reload list + Identify.  
8. Hủy enroll giữa chừng: **không** xóa mẫu đã lưu; **không** POST.

#### Preview gate trước khi enroll (P1.1i — bắt buộc)

**Phạm vi:** chỉ **mode ĐĂNG KÝ** (`AppMode.ENROLL`). Mode **Chấm công** (§9.3) **không** áp dụng rule này — Identify vẫn hiện preview khi quét.

| Điều kiện | Hành vi vùng quét | Banner |
|-----------|-------------------|--------|
| Mode Enroll + máy đã mở + `registering = false` + người dùng đặt ngón | **Không** vẽ ảnh fingerprint; giữ empty / “Chờ đặt ngón tay…” | Cảnh báo VN: `Chưa nhấn Bắt đầu đăng ký. Chọn nhân viên rồi bấm Bắt đầu đăng ký trước khi quét.` |
| Mode Enroll + `registering = true` | Hiện preview + xử lý enroll 3 lần như hiện tại | Theo tiến độ quét |
| Mode Chấm công | Preview + Identify bình thường | Theo §9.3 |

- Debounce cảnh báo ≥ **1s** (tránh spam banner mỗi lần SDK capture ~200ms).  
- **Không** tính bước 1/3; **không** gọi API enroll khi chưa `registering`.

#### Trạng thái nút (bắt buộc)

| Nút | Hiện / Enable khi |
|-----|-------------------|
| Kết nối / Mở thiết bị | Máy chưa mở |
| Đóng thiết bị | Máy đang mở; **không** đang enroll (hoặc đóng = hủy enroll) |
| Tải DS nhân viên | Không đang enroll (khuyến nghị) |
| **Bắt đầu đăng ký** | Máy đã mở + đã chọn NV + **không** đang enroll |
| **Xóa vân tay** (P2.2) | Mode Enroll; NV đã ĐK; **không** đang enroll; confirm trước khi DELETE kiosk |
| **Hủy đăng ký** | Mode Enroll: **luôn hiện** trên cùng hàng với Bắt đầu. **Enable chỉ khi** `registering = true`. Idle (`registering = false`): **hiện + disabled**. Hủy = dừng phiên, reset bước, **không** gọi API xóa template đã lưu |

#### Layout visual (P1.1b + P1.1i)

Chỉnh giao diện Agent Swing theo mockup “Biometric Enroll”. **Không** đổi API, auth kiosk, luồng 3 lần quét, hay Web.

```
[title bar] Biometric Enroll
[logo] VÂN TAY NHÂN VIÊN — Đăng ký                       [pill Máy: …]   ← mép trái thẳng content (P1.1h)
Đơn vị: {deptName}
Tổng · Đã đăng ký · Chưa đăng ký              ← hàng chỉ số (không nút Tải DS)
Lọc: [Tất cả | Chưa ĐK | Đã ĐK]     [ nút navy: Tải DS nhân viên ]  ← cùng hàng (P1.1g)
Nhân viên: [dropdown rộng]
           [ 1 KẾT NỐI — 2 QUÉT — 3 HOÀN TẤT ]   ← stepper căn giữa ngang (P1.1h)
┌─ Card ─────────────────────────────────────┐
│ Banner hướng dẫn (1 dòng)                    │
│ ┌─ vùng quét (dashed) ───────────────────┐ │
│ │ empty / preview ảnh                      │ │
│ │ MÃ: {empCodeFormatted}   [badge phiên quét] │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
[ Bắt đầu đăng ký ]  [ Hủy đăng ký ]  ← cùng hàng, **bằng nhau** (Grid 1×2) — P1.1j
[ Kết nối thiết bị ]  [ Ngắt kết nối ]   ← secondary
```

| Stepper bước | Active khi |
|--------------|------------|
| 1 KẾT NỐI | Thiết bị chưa mở |
| 2 QUÉT | Đã kết nối và chưa ở trạng thái hoàn tất lần enroll hiện tại (chờ / đang enroll) |
| 3 HOÀN TẤT | Enroll API thành công — **giữ** đến khi user **Bắt đầu đăng ký** lần mới hoặc **Ngắt kết nối** |

**Phân biệt:** badge `ĐANG QUÉT (n/3)` = tiến độ 3 lần quét trong bước 2; **không** thay cho bước 3 stepper.

| Badge vùng quét | Khi | Ghi chú |
|-----------------|-----|---------|
| *(ẩn / trống)* | Idle: máy chưa mở hoặc đã mở nhưng chưa enroll / không vừa hoàn tất | **P1.1g:** không hiện `CHƯA KẾT NỐI` / `SẴN SÀNG` — trùng pill `Máy: …` + stepper |
| ĐANG QUÉT (n/3) | Đang enroll | Giữ |
| THÀNH CÔNG | Sau lưu DB OK (giữ cùng lúc bước 3) | Giữ |
| LỖI | Lỗi SDK / API enroll | Giữ |

**Nguồn trạng thái máy (P1.1g):** chỉ pill header **`Máy: Chưa kết nối` / `Đã kết nối`** (+ lỗi USB ngắn). Không nhân đôi ý nghĩa trên badge vùng quét.

**Hierarchy nút (P1.1j):** Primary = Bắt đầu đăng ký → **Danger solid** = Hủy đăng ký (nền `#EF4444`, chữ trắng — **không** viền outline) → **Navy action** = Tải DS nhân viên (**hàng lọc**, P1.1g) → Secondary = Kết nối / Ngắt.  
Dialog thành công §11 giữ nguyên.

#### Hàng nút Enroll + window (P1.1i + P1.1j)

| Mục | Rule |
|-----|------|
| Hàng Enroll | `GridLayout(1, 2, 8, 0)` — **Bắt đầu** và **Hủy** **bằng nhau** chiều ngang, cùng hàng, căn giữa dọc. **Cấm** primary `maxWidth = ∞` làm nút kéo full hàng |
| Style Hủy (P1.1j) | **Danger solid:** nền **`#EF4444`**, chữ **trắng**, **không** viền đỏ. Disabled (idle): nền `#FECACA`, chữ trắng — vẫn hiện |
| Window state lúc mở | `setExtendedState(MAXIMIZED_BOTH)` — **maximize** desktop (còn title bar). **Không** exclusive fullscreen (`setFullScreenWindow`). Áp dụng mọi mode (Chấm công / Đăng ký) |
| Phạm vi | Agent Swing only; không đổi API / Web |

#### Spacing + card (P1.1j — chỉ UI)

| Mục | Rule |
|-----|------|
| `SECTION_GAP` | **12px** giữa mọi khối chính (brand → Đơn vị → chỉ số → lọc → NV → stepper → card → actions → device). Thay 8px cũ khi maximize |
| Strut nội bộ | Trong hàng Nhân viên: gap label→combo = **4px** (cố định, nhỏ hơn section). Không thêm strut tùy ý khác |
| Scan card | `preferred` / `maximum` height **cố định ≤ 360px** — **không** stretch full viewport khi maximize |
| Hàng chỉ số / lọc / stepper | Max height ổn định (28–40px); không để component phình theo BoxLayout Y |

#### Layout polish (P1.1c — chỉ UI)

| Mục | Rule |
|-----|------|
| Mép trái | Một `content` column: **Đơn vị**, hàng **Tổng/Đã/Chưa**, hàng **Lọc**, label **Nhân viên** thẳng cùng inset trái (không lệch FlowLayout/padding từng hàng) |
| Hover nút | **Không** đổi màu nền/chữ khi hover (`rolloverEnabled=false`; màu cố định) |
| Primary | Nền `#2563EB`, chữ trắng; disabled: nền `#93C5FD`, chữ trắng — vẫn đọc được |
| Secondary | Nền trắng, viền `#2563EB`, chữ `#1D4ED8`; hover giữ nguyên |
| Chip lọc | Selected: primary + trắng; unselected: trắng + navy; không hover đổi màu |
| Stepper bước 3 | **Cấm** reset về bước 2 ngay khi đóng dialog thành công |

#### Brand header (P1.1d — logo local; chữ body sửa bởi P1.1h)

| Mục | Rule |
|-----|------|
| Logo trong app | **Local-only** classpath: `src/branding/biometrics.png` → `/branding/biometrics.png`. ~28×28 px cạnh app title `VÂN TAY NHÂN VIÊN` |
| Icon cửa sổ | **Local-only** classpath: `src/branding/hospital-logo.png` → `/branding/hospital-logo.png`. `setIconImage` cạnh title bar **`Biometric Enroll`** |
| Cấm | **Không** gọi `GET /api/public/branding`; **không** dùng `logoUrl` Web/Settings lúc runtime |
| Fallback | Thiếu / lỗi file: chỉ hiện chữ body title (không icon placeholder) |
| Phạm vi | **Không** đổi API enroll/auth/kiosk |

#### Title + stepper (P1.1h — chỉ UI)

| Mục | Rule |
|-----|------|
| Window title | `setTitle("Biometric Enroll")` — **tách** khỏi chữ trong app |
| Window icon | `setIconImage` từ **`/branding/hospital-logo.png`** (cạnh chữ Biometric Enroll trên title bar) |
| App title (hàng đầu) | Cố định **`VÂN TAY NHÂN VIÊN`** + logo **`/branding/biometrics.png`** — **không** dùng `Biometric Enroll` trong body |
| Mép trái app title | Logo `biometrics.png` + `VÂN TAY NHÂN VIÊN` **thẳng mép trái** content với Đơn vị / chỉ số / Lọc / Nhân viên (củng cố P1.1c; hgap logo→chữ tối đa 8px, không indent thừa) |
| Pill Máy | Phải cùng hàng app title, căn giữa dọc |
| Stepper | Hàng `1 KẾT NỐI — 2 QUÉT — 3 HOÀN TẤT` **căn giữa ngang** content (không bắt đầu từ mép trái). Logic bước giữ P1.1c |

#### Agent chrome polish (P1.1f — chỉ UI)

| Mục | Rule |
|-----|------|
| Logo | Theo P1.1d **local** (bỏ hoàn toàn phụ thuộc branding Web) |
| Căn hàng brand | Logo + chữ brand (trái) và pill Máy (phải): **cùng hàng, căn giữa theo chiều dọc** (baseline/vertical center), chiều cao hàng ~40px |
| Nút Tải DS (kiểu) | **Solid navy** `#001A4D`, chữ trắng — **không** còn kiểu link xanh. Disabled: nền `#2A3F75`. Enable khi **không** đang enroll |
| `Tổng: n` | Màu **`#001A4D`** (navy/đen brand) |
| `Đã đăng ký` | Giữ primary `#2563EB` |
| `Chưa đăng ký` | Giữ danger `#EF4444` (P1.1e) |

> **P1.1f vị trí Tải DS trên hàng chỉ số đã bị P1.1g thay:** Tải DS chuyển sang **hàng lọc**.

#### Layout + message polish (P1.1g — chỉ UI)

| Mục | Rule |
|-----|------|
| Vertical rhythm | Khoảng cách giữa brand → Đơn vị → chỉ số → lọc → NV → stepper → card → actions **đều** (một hằng `SECTION_GAP` = **12px** — P1.1j; không mix strut tùy ý) |
| Hàng chỉ số | Chỉ `Tổng` / `Đã đăng ký` / `Chưa đăng ký` — **không** nút Tải DS |
| Hàng lọc | Chip lọc (trái) + nút **Tải DS nhân viên** (phải): **cùng hàng, căn giữa dọc** |
| Trạng thái máy | Chỉ pill header `Máy: …`. **Cấm** badge `CHƯA KẾT NỐI` / `SẴN SÀNG` trên vùng quét |
| Badge vùng quét | Chỉ hiện khi phiên quét: `ĐANG QUÉT (n/3)` / `THÀNH CÔNG` / `LỖI`; idle = ẩn |
| Lỗi API banner | Câu Việt ngắn + **mã lỗi** (NV báo Admin). **Cấm** ghép raw `ex.getMessage()` tiếng Anh. Chi tiết kỹ thuật → log console |

#### Banner tone (P1.1k — bắt buộc)

Áp dụng **toàn Agent** (mode Đăng ký + Chấm công): banner trong card quét đổi màu theo loại thông báo. **Không** để mọi banner cùng primary xanh.

| Tone | Dùng khi | Nền | Chữ |
|------|----------|-----|-----|
| **SUCCESS** | Thành công: enroll OK, tải DS OK, kết nối OK, nạp mẫu OK, Chấm công ghi nhận OK… | `#DEFBE8` | `#10B981` |
| **WARNING** | Cảnh báo / cần hành động: chưa Bắt đầu mà quét, hủy phiên, thiếu mẫu, sai ngón, Identify fail nhẹ, REJECTED ngoài khung giờ… | `#FFFBEB` | `#F59E0B` |
| **DANGER** | Lỗi: SDK/API fail, `E-API-*`, DBMerge/DBAdd fail, không mở máy… | `#FEF2F2` | `#EF4444` |
| **INFO** | Hướng dẫn trung tính / idle (chọn NV, đang quét lần n/3, chuyển mode…) | `#EFF6FF` | `#2563EB` |

API: `setBanner(text, tone)` — mọi chỗ gọi phải gắn tone đúng bảng trên. Không đổi API BE/Web.

#### Ngoài phạm vi ticket UX này

- Login Admin/HEAD trên Agent.  
- ~~Mode Identify Chấm công ngày (P2).~~ → **§9.3 / P2.1**.  
- ~~Xóa template trên Agent~~ → **P2.2** cho phép xóa qua kiosk token (§5.1 `finger_label`).  
- Nhiều template active / NV (chỉ 1 ngón active — P2.2).  
- Đổi logic BE/Web / auth / API (trừ field UI đã có: `deptName`; P2.2: `fingerLabel` + DELETE kiosk).

---

## 10. UI

### HEAD (Web)

- Xem trạng thái ĐK + **ghi chú ngón** (`fingerLabel`) khi đã ĐK — **không** nút/API xóa template (chốt A / Agent-only CRUD).  
- Chấm công: badge ĐI LÀM / ĐI TRỄ read-only; cột **giờ vào / giờ ra** (lớp A); nút **Chi tiết quét** → log append-only (lớp B); nút thủ công 4 status + **date range**; link **Lịch thủ công** (§3.2.2); hint **Thiếu giờ ra** (§4.5.1).  
- Roster ngày: **full NV active** + null nếu chưa có bản ghi.  
- **Không** tạo màn “Lịch sử ra vào” riêng — gắn trên màn Chấm công hằng ngày.  
- **Không** LockBanner theo 06:00–16:00.  
- Gửi báo cáo khi COMPLETED (mục 4.5).  
- Agent Online/Offline — **P4** §9.5.2 (heartbeat + cột Admin)

### ADMIN (Web)

- Enroll / xóa template **mọi khoa chỉ qua Agent** (+ đổi token — §10.2). Web: xem `fingerLabel` trên DS NV; **không** DELETE template.  
- **Chi tiết Đơn vị** (Bảng điều khiển): cột giờ vào/ra + Chi tiết quét (lớp A+B); full roster + null.  
- **P3f:** quick-action 4 status + modal khoảng ngày (§3.2.1); hint **Thiếu giờ ra** (§4.5.1); link **Lịch thủ công** (§3.2.2).  
- **P3g:** cột THAO TÁC — gom thao tác liên quan vân tay / Agent vào **một nút dropdown** (§10.6); quick-action 4 status vẫn hiện riêng.  
- **Không** màn lịch sử ra vào riêng; **không** dùng `AttendancePage` HEAD cho Admin.  
- Dashboard / donut / Excel / AI đọc: **đủ 6 status**, cùng nguồn DB mục 5.  
- Catalog: `DI_TRE`, `THAI_SAN`.  
- Settings: `late_cutoff`, cửa sổ IN/OUT (phase Settings) — **không** dùng làm khóa sổ HEAD.  
- Admin dashboard toggle khóa sổ = **legacy** — copy UI phải nói rõ **không** khóa Agent/HEAD (§4.9).  
- **Cài đặt → Quản lý token vân tay** — §10.1 (binding).

### 10.3 Chấm công — lớp A (bản ghi ngày) + lớp B (log quét) trên màn hiện có

**Binding P3a.** Không invent tab/màn mới.

| Lớp | Nguồn | UI |
|-----|--------|-----|
| **A** | `attendance_records`: `status`, `check_in_at`, `check_out_at`, `source` | Cột Giờ vào / Giờ ra trên HEAD Chấm công + Admin Chi tiết Đơn vị |
| **B** | `fingerprint_scan_logs` append-only | Modal **Chi tiết quét** (IN/OUT/REJECTED); không sửa |

| Rule | Chi tiết |
|------|----------|
| Roster | Full NV `active` của khoa + field null khi chưa có record |
| A ≠ B | Giờ trên bảng = bản ghi ngày (rule C / OUT MAX); modal = mọi lần máy quét |
| HEAD auth log | Chỉ emp thuộc `deptCode` HEAD |
| ADMIN auth log | Mọi khoa |
| API A | `GET /api/attendance/page` — DTO có `checkInAt`, `checkOutAt`, `source` |
| API B | `GET /api/attendance/scan-logs?empCode=&date=&page=&pageSize=` (max pageSize 50); role check trong service |
| Modal FE | `ScanLogModal`: cột Thời điểm / Hướng / **Độ khớp vân tay** (`score`) / Ghi chú; desktop `max-w-3xl`; header + ô `whitespace-nowrap` (không xuống hàng) |
| Cấm | Trả template; HEAD sửa giờ/log; poll dày |

### 10.6 Admin Chi tiết Đơn vị — menu **Vân tay** (P3g — bắt buộc)

Cột **THAO TÁC** / card mobile: không xếp dọc nhiều link văn bản (Điền giờ, Đưa về chưa chấm, Chi tiết quét) — chiếm diện tích hàng.

| Rule | Chi tiết |
|------|----------|
| Giữ riêng (không vào menu) | `QuickActionGroup` 4 status thủ công; link **Lịch thủ công** (§3.2.2) |
| Nút trigger | Một nút **Vân tay** + chevron; semantic token (outline / primary text) — không hardcode hex |
| Menu items (thứ tự) | 1) **Chi tiết quét** (luôn có) · 2) **Điền giờ** (chỉ khi còn ô trống và không status thủ công vắng — §4.6) · 3) **Đưa về chưa chấm** (chỉ khi còn status hoặc còn giờ — §4.11; style danger) |
| Hành vi | Click item → đóng menu → mở modal/handler tương ứng (không đổi API) |
| UX | Click ngoài / Esc đóng menu; một menu mở tại một thời điểm trên hàng |
| FE | `DeptFingerprintActionsMenu.jsx` — dùng trên `DeptAttendanceRow` + `DeptAttendanceStaffCard` |
| HEAD Chấm công | **Không** bắt buộc đổi sang menu này trong P3g (giữ link Chi tiết quét / Lịch thủ công như hiện tại) |

### Agent (desktop — Enroll)

Theo **§9.1**. Layout hiện đại, dễ thao tác: chỉ số Tổng / Đã ĐK / Chưa ĐK; lọc 3 trạng thái; notice thành công rõ; tên đơn vị thật.  
Đổi khoa enroll: sửa `kiosk.token` trong `agent.properties` — §10.2.

Theme Web: token + `lg` 1024 theo SPEC_ADMIN/HEAD.

### 10.4 KPI card trạng thái — typography nhãn (P3c)

Chuẩn tham chiếu: HEAD Chấm công (`AttendanceStatusTile`).

| Thuộc tính | Rule |
|------------|------|
| Font-weight nhãn | **700** (`font-bold`) |
| Màu chữ nhãn | **đen** (`text-black`) — không `text-content-muted` / màu semantic theo status |
| Casing | `uppercase`; ưu tiên `badgeLabel` catalog |
| Tiếng Việt có dấu | **Không được cắt dấu / clip glyph**; tránh tổ hợp `leading-tight` quá sít + `truncate` trên nhãn 2 dòng |
| Số đếm trên card | Vẫn màu semantic theo `color_key` (`KPI_LABEL_CLASS_BY_COLOR`) |
| Token FE | `KPI_STATUS_LABEL_CLASS` (+ size variants) trong `utils/statusBreakdown.js`; line-height đủ thoáng cho chữ in hoa tiếng Việt |

Áp dụng: HEAD Chấm công / Thống kê; ADMIN Tổng quan + Chi tiết Đơn vị (desktop + mobile status tiles).  
Card “Tổng quân số” cũng theo cùng typography-safe rule của card KPI tham chiếu.

### 10.5 Unified metric/stat cards (P3d)

Chuẩn tham chiếu: `Bảng điều khiển > Chi tiết Đơn vị` (desktop) và biến thể mobile cùng layout.

| Hạng mục | Rule |
|----------|------|
| Scope | Toàn bộ card KPI / stat ở web `ADMIN` + `HEAD` dùng cùng card shell và typography family |
| Shell | `bg-surface-white`, `border-line`, `rounded-xl`, `shadow-card`, icon box bo góc, khoảng cách/gap đồng bộ |
| Desktop metric card | Layout ngang: icon trái, số lớn đậm, nhãn phía dưới; chiều cao tối thiểu đủ cho nhãn 2 dòng tiếng Việt |
| Mobile metric card | Cùng nhận diện với desktop; không giữ kiểu cũ khác màu/chữ muted nếu card cùng loại metric |
| Nhãn card | Ưu tiên `font-bold` + `text-black`; line-height an toàn tiếng Việt; chỉ dùng `truncate` cho nhãn 1 dòng thật sự cần |
| Shared FE | Refactor về component dùng chung (`KpiMetricCard`, `AttendanceStatusTile`, `StatCard` hoặc wrapper chung) thay vì style rời từng màn |

Áp dụng tối thiểu:
- `ADMIN`: Dashboard tổng quan, Dashboard chi tiết đơn vị, Đơn vị, Nhân viên, Tài khoản, Token kiosk, Danh mục trạng thái, Danh mục thuộc tính nhân sự
- `HEAD`: Chấm công, Thống kê và các stat card dùng chung từ admin shell

### 10.1 Admin Web — Quản lý token vân tay (binding)

**Nav (SPEC_ADMIN):** Cài đặt → **Quản lý token vân tay**  
- `tabId`: `settings-fingerprint-tokens`  
- Hash: `#admin/settings-fingerprint-tokens`  
- Role: **ADMIN only** (HEAD **không** thấy menu / API 403)

**Mục đích:** phát hành / thu hồi / xoay token kiosk gắn **một** `deptCode` — nguồn quản lý tập trung (thay dần bootstrap YAML trên production).

#### UI

| Thành phần | Rule |
|------------|------|
| Page FE | `frontend/src/components/settings/FingerprintKioskTokensPage.jsx` |
| Import (từ `settings/`) | `../shared/FlashBanner`, `../../constants/admin`, `../../services/api` — **không** dùng `../../../` (ra ngoài `src/`) |
| Bảng danh sách | Cột: khoa, nhãn, **Token**, **PIN Đăng ký** (plaintext Admin — ops), trạng thái, ngày tạo, thao tác |
| Cột Token (list) — **phương án A (ops)** | Admin **được** xem lại plaintext token **active** để copy vào `agent.properties` trên PC khoa (không cần xuống từng khoa). List API trả `token` khi `active=true` và DB còn `token_plaintext`. Token đã thu hồi: `token=null`, UI `—`. Bản ghi cũ thiếu plaintext: UI `—` + gợi ý **Xoay** để cấp lại |
| Cột PIN Đăng ký (P2.1e — **cùng màn**, không tách Settings) | PIN khóa mode Enroll trên Agent (§9.3.2). List trả `enrollPin` khi **active** và đã lưu. Inactive / chưa đặt: UI `—`. Nút **Sao chép** + thao tác **Đặt PIN** (FormModal). Copy vào `enroll.pin` trong `agent.properties` |
| Cột **Agent** (P4 §9.5.2) | Pill **Online** / **Offline** từ `agentOnline` (+ `lastHeartbeatAt`). Poll list ~60s khi trang mở. KPI **Agent Online** trên StatGrid |
| Plaintext lưu trữ | Cột DB `token_plaintext` **và** `enroll_pin` (VARCHAR) song song `token_hash`. Auth kiosk vẫn chỉ so **hash**. Thu hồi: **xóa** `token_plaintext` + `enroll_pin`. Xoay token: **giữ** `enroll_pin` sang bản ghi active mới |
| Tạo / phát hành | Dialog **`FormModal`**: chọn khoa + nhãn → POST → **thu hồi token active cũ cùng khoa** (P4b §8.3) rồi phát hành mới; list có token; PIN đặt sau bằng **Đặt PIN** |
| Thu hồi | Dialog **`DeleteModal`**: `active=false`, xóa `token_plaintext` + `enroll_pin` |
| Xoay | Dialog **`FormModal`**: deactivate cũ + phát hành mới (token mới); **chuyển** `enroll_pin` sang token mới nếu có |
| Empty | Khoa chưa có token active: CTA “Phát hành token” |
| Bootstrap YAML | Dev: bootstrap ghi cả hash + plaintext từ YAML **chỉ khi** `token_hash` chưa từng tồn tại (kể cả bản ghi đã thu hồi). Không insert trùng → tránh crash UNIQUE lúc start |

#### UI layout polish (P1.2b — đồng bộ settings-users; **3 KPI**)

**Tham chiếu FE:** `UserPermissionsPage` + `AccountStatGrid` + `RegistryTableShell` + `TablePagination`.  
**Chốt KPI:** đúng **3** thẻ (không làm 4 ô mockup “Hết hạn / Xoay gần nhất” — chưa có field DB).

| Khối | Rule |
|------|------|
| Breadcrumb | `AdminSubmenuBreadcrumb` (Cài đặt → Quản lý token vân tay) |
| Header trang | **Không** hiện title/hint/`agentHint` trên body trang |
| CTA Phát hành | Cùng hàng **Danh sách token**; `btn-primary` + `Plus` |
| Flash | `FlashBanner` success/error như hiện tại |
| KPI | Tổng / Đang dùng / Đã thu hồi — `StatCard` |
| Bảng | `RegistryTableShell` + pagination client |
| Cột Token | Mono plaintext (active) + nút **Sao chép**; inactive / thiếu plaintext → `—` |
| Cột trạng thái | Pill giống `AccountRow` (Phân quyền): `inline-block px-2.5 py-1 rounded-full text-xs font-semibold` + `badge-success` (Đang dùng) / `badge-neutral` (Đã thu hồi) — **không** chỉ gắn class màu không bo pill |
| Cột PIN Đăng ký | Mono PIN (active + đã đặt) + **Sao chép**; thiếu → `—`; thao tác **Đặt PIN** trên dòng active |
| Modal phát hành | **`FormModal`** — không dùng overlay form tự chế lệch design system |
| Modal Đặt PIN | **`FormModal`**: PIN 4–8 chữ số → POST enroll-pin; copy gợi ý `enroll.pin=…` |
| Modal xác nhận Xoay | **`FormModal`** — không dùng `window.confirm` trình duyệt |
| Modal xác nhận Thu hồi | **`DeleteModal`** — không dùng `window.confirm` trình duyệt |
| Modal sau phát hành / xoay | FormModal hoặc tương đương: hiện token + Sao chép + Đóng |

**Cấm:** invent expiry/rotated KPI; hardcode hex; layout lệch settings-users; HEAD xem token; đưa token ra Tailscale/public.

#### API (ADMIN session)

| Method | Path | Ghi chú |
|--------|------|---------|
| GET | `/api/admin/fingerprint/kiosk-tokens` | List + `token` + **`enrollPin`** khi active đã lưu — **không** trả `token_hash` |
| POST | `/api/admin/fingerprint/kiosk-tokens` | Body: `deptCode`, `label?` → lưu hash + plaintext; response có `token` |
| POST | `/api/admin/fingerprint/kiosk-tokens/{id}/enroll-pin` | Body: `{ "enrollPin": "8700" }` — chỉ token **active**; PIN **4–8 chữ số**; response DTO cập nhật |
| POST | `/api/admin/fingerprint/kiosk-tokens/{id}/revoke` | Thu hồi + xóa plaintext token + PIN |
| POST | `/api/admin/fingerprint/kiosk-tokens/{id}/rotate` | Xoay token; **giữ** PIN trên bản ghi mới |

DB: `fingerprint_kiosk_tokens`: `token_hash` + `token_plaintext` + **`enroll_pin`** (Admin reveal; clear khi inactive).

**Cấm:** HEAD gọi API này; trả raw template vân tay; trả `token_hash` ra client; **tách** màn Settings riêng chỉ để quản lý PIN (PIN gắn cùng màn token).

Agent (P2.1d): vẫn đọc `enroll.pin` từ `agent.properties` — Admin copy từ cột PIN (ops). Chưa bắt buộc Agent kéo PIN từ API trong phase này.

### 10.2 Workflow đã xác nhận — Admin đổi token Agent để enroll từng khoa

**Đúng / được phép:** Admin ngồi tại **một máy có ZK9500** (hoặc laptop + USB ZK9500), **không** cần login Admin bên trong Agent.

| Bước | Việc |
|------|------|
| 1 | Admin Web → Cài đặt → Quản lý token vân tay → copy **token** + **PIN Đăng ký** khoa X |
| 2 | Sửa `fingerprint-agent/agent.properties`: `api.baseUrl=<BE LAN>`; `kiosk.token=<token>`; `enroll.pin=<PIN>` |
| 3 | Chạy / restart Agent → `GET /api/kiosk/health` → UI **Đơn vị** = tên khoa X; DS NV = chỉ khoa X |
| 4 | Enroll: bấm Đăng ký → nhập PIN → (đã ĐK → confirm ghi đè) → quét 3 lần → nhập `fingerLabel` → POST enroll |
| 5 | Đổi khoa Y: sửa `kiosk.token` + `enroll.pin` theo token/PIN khoa Y → restart Agent → lặp bước 3–4 |

| Điều kiện | Bắt buộc |
|-----------|----------|
| BE reachable | `api.baseUrl` đúng (không `localhost` nếu BE máy khác) |
| Token | `active=true`, hash khớp DB, gắn đúng `deptCode` |
| Phần cứng | ZK9500 + driver / `java.library.path` |
| Agent | **Không** đăng nhập session ADMIN/HEAD — chỉ token kiosk |

**Cấm hiểu nhầm:** Agent không có combo “chọn khoa” cho Admin; đổi khoa = **đổi `kiosk.token`** (hoặc dùng máy khoa đã cấu hình sẵn token đó).

---

## 11. Thông báo (Vietnamese) — lỗi & thành công Agent

| Case | Message |
|------|---------|
| Agent offline | Không kết nối được dịch vụ vân tay trên máy này. Mở Agent và kiểm tra ZK9500. |
| Device fail | Không tìm thấy ZK9500. Kiểm tra USB/driver. |
| Enroll thiếu lần | Cần quét cùng một ngón lần nữa ({n}/3). |
| Khác ngón | Vui lòng dùng cùng ngón tay đã quét trước đó. |
| Enroll thành công | `Đăng ký thành công vân tay cho nhân viên {fullname}.` (dialog + vùng status; không bị reload ghi đè) |
| Enroll — thiếu ghi chú ngón (P2.2) | `Vui lòng nhập ghi chú ngón tay (ví dụ: Ngón cái tay phải).` |
| ĐK lại — confirm ghi đè (P2.2) | `Nhân viên đã có vân tay{ — {fingerLabel}}. Đăng ký lại sẽ ghi đè mẫu cũ. Tiếp tục?` |
| Xóa vân tay — confirm (P2.2) | `Xóa vân tay của {fullname}? Thao tác không thể hoàn tác trên máy này.` |
| Xóa vân tay — thành công | `Đã xóa vân tay của {fullname}.` |
| Tải DS OK | `Đã tải {n} nhân viên thuộc đơn vị {deptName}.` |
| Tải DS — thiếu deptName | `Đã tải {n} nhân viên thuộc đơn vị {deptCodeFormatted}.` — **cấm** chữ “kiosk” trên UI |
| Tải DS / bootstrap — connection refused / getsockopt | `Lỗi tải nhân viên (mã: E-API-CONN).` — **P1.1g**; cấm raw English |
| Tải DS / bootstrap — timeout | `Lỗi tải nhân viên (mã: E-API-TIMEOUT).` |
| Tải DS — HTTP / lỗi khác | `Lỗi tải nhân viên (mã: E-API-HTTP).` hoặc `E-API-UNKNOWN` |
| Bootstrap API fail (cùng nhóm kết nối) | `Lỗi kết nối hệ thống (mã: E-API-CONN).` (cùng map mã) |
| Enroll API lỗi | `Quét OK nhưng không gửi được lên hệ thống (mã: E-API-ENROLL).` — chi tiết kỹ thuật log console; **không** ghép raw English lên banner |
| Trùng NV khác | Vân tay đã đăng ký cho NV {mã} — {tên}. |
| Identify fail | Không nhận diện được. Thử lại hoặc đăng ký lại vân tay. |
| Chưa enroll | Nhân viên chưa đăng ký vân tay. |
| Thủ công khóa scan | Nhân viên đang được ghi {trạng thái}. Không ghi nhận giờ từ vân tay. |
| Đã gửi báo cáo (scan) | Đã gửi báo cáo. |
| Đã gửi báo cáo (HEAD) | Đã gửi báo cáo cho ngày này. |
| Đã có DI_LAM/DI_TRE | Nhân viên đã Chấm công bằng vân tay. Không được gán trạng thái khác. |
| HEAD sửa dữ liệu quét | Không được phép sửa giờ/trạng thái đã quét vân tay. |
| Rejected — ngoài giờ (Agent banner B1) | `… - TỪ CHỐI — Ngoài khung giờ vào/ra. Không ghi nhận.` |
| Rejected — đã gửi BC (Agent banner B1) | `… - TỪ CHỐI — Đã gửi báo cáo.` |
| Public ghi biometric | Thao tác vân tay chỉ thực hiện trên mạng nội bộ. |
| AI batch DI_LAM | Đi làm / Đi trễ chỉ ghi nhận qua vân tay. |
| Khoảng ngày không hợp lệ | Ngày kết thúc phải sau hoặc bằng ngày bắt đầu. |
| Khoảng ngày quá dài | Khoảng ngày tối đa 366 ngày. |
| Không ngày nào cập nhật | Không cập nhật được ngày nào trong khoảng (đã quét vân tay hoặc đã gửi báo cáo). |
| Báo cáo thiếu status | Vui lòng gán đủ trạng thái cho mọi nhân viên chưa quét vân tay trước khi gửi báo cáo. |
| Soft clear — lý do trống | Lý do không được để trống. |
| Soft clear — đã trống | Nhân viên đã ở trạng thái chưa chấm. |
| Soft clear — không có bản ghi | Không có bản ghi Chấm công để đưa về chưa chấm. |
| Soft clear — OK | Đã đưa về chưa chấm. |

---

## 12. API (phác thảo — chỉ khi được giao)

| Việc | Ai | Ghi chú |
|------|-----|---------|
| Enroll / delete template | **Chỉ Agent** + kiosk token | **Cấm** Web HEAD/ADMIN DELETE hoặc enroll template |
| GET status registered + `fingerLabel` | HEAD dept / ADMIN | Không raw template |
| GET `/api/kiosk/health` | Agent + token kiosk | `ok`, `deptCode`, `deptCodeFormatted`, **`deptName`** (từ `departments`), `label` (nhãn token — **không** dùng làm tên đơn vị trên UI Agent) |
| POST `/api/kiosk/heartbeat` | Agent + token kiosk | P4 §9.5.2 — cập nhật `last_heartbeat_at` |
| GET `/api/kiosk/staff` | Agent + token kiosk | NV active khoa; `fingerprintRegistered` + **`fingerLabel`** (P2.2) |
| POST `/api/kiosk/fingerprints/enroll` | Agent + token kiosk | Template Base64 + **`fingerLabel` bắt buộc**; scope khoa token |
| DELETE `/api/kiosk/fingerprints/{empCode}` | Agent + token kiosk | Soft-delete template active (P2.2); scope khoa token |
| GET `/api/kiosk/fingerprints/templates` | Agent + token kiosk | Template active khoa (P2.1 Identify) |
| POST `/api/kiosk/fingerprints/scan` | Agent + token kiosk + LAN | Rule C; log; cập nhật day-record (P2.1) |
| GET `/api/admin/fingerprint/kiosk-tokens` | ADMIN | List metadata token kiosk (§10.1) |
| POST `/api/admin/fingerprint/kiosk-tokens` | ADMIN | Phát hành; lưu + trả plaintext (P1.2c) |
| PUT `/api/admin/attendance/times` | ADMIN | Điền ô giờ trống (§4.6); không ghi đè; rule C khi gán status |
| POST `/api/admin/attendance/clear` | ADMIN | Soft clear → chưa chấm (§4.11); `reason` bắt buộc; được sau submit |
| PUT `/api/attendance/manual-range` | HEAD / ADMIN | Khoảng ngày thủ công (§3.2.1); whitelist 4 status; `applyManualStatus` |
| POST `/api/attendance/manual-range/preview` | HEAD / ADMIN | Đếm ngày trùng vân tay / submit trước khi ghi (§3.2.1) |
| GET `/api/attendance/manual-schedule` | HEAD / ADMIN | Lịch thủ công gộp khoảng theo NV (§3.2.2) |
| POST `/api/admin/fingerprint/kiosk-tokens/{id}/revoke` | ADMIN | Thu hồi + xóa plaintext |
| POST `/api/admin/fingerprint/kiosk-tokens/{id}/rotate` | ADMIN | Xoay; lưu + trả plaintext mới |
| POST scan | Agent + token kiosk + LAN | Rule C; không assertCanWrite khóa sổ; khóa sau submit (§4.7) |
| GET page / stats / dashboard | Session | Cùng nguồn mục 5 |
| PUT attendance thủ công | HEAD whitelist 4 status + không đè DI_LAM/DI_TRE (§4.8); khóa sau submit | |
| Report submit | HEAD | COMPLETED = đủ hợp lệ §4.5 |
| Head AI confirm-batch-attendance | **Reject** DI_LAM/DI_TRE | Mục 7; batch thủ công OK |

---

## 13. Phase

| Phase | Phạm vi |
|-------|---------|
| **P1** | DB fingerprints + enroll API/UI + Agent enroll |
| **P1.1 (UX Agent)** | §9.1 + P1.1b–**h** (window `Biometric Enroll`, body `VÂN TAY NHÂN VIÊN`, stepper center) — **không đổi logic** |
| **P1.1i** | Preview gate Enroll; hàng nút Bắt đầu + Hủy ngang; maximize lúc mở (§9.1 P1.1i) |
| **P1.1j** | Spacing đều (`SECTION_GAP=12`); nút Enroll bằng nhau; Hủy danger solid; card không stretch |
| **P1.1k** | Banner tone: SUCCESS xanh / WARNING vàng / DANGER đỏ (+ INFO hướng dẫn) |
| **P1.2** | Admin Web **Quản lý token vân tay** (§10.1) + docs workflow đổi token Agent (§10.2) |
| **P1.2b** | UI token: 3 KPI + `RegistryTableShell` + `TablePagination` đồng bộ settings-users |
| **P1.2c** | Phương án A: lưu/trả `token_plaintext` Admin; FormModal phát hành/xoay; DeleteModal thu hồi; cột Token + Copy |
| **P2** | Logs + day record (check_in/out, status) + rule C + khóa chéo + tắt AI batch DI_LAM |
| **P2.1** | Agent mode **Chấm công** (§9.3): Identify + GET templates + POST scan + mutex Enroll |
| **P2.1a** | `zk_fid = emp_code` (enroll + load Identify); migrate V10; banner nạp `loaded/total` |
| **P2.1b** | Agent Chấm công: **1 dòng** `mã - tên - VÀO/RA THÀNH CÔNG`; bíp; layout ≤960px (§9.3.1) |
| **P2.1c** | Âm kiosk WAV chime/buzz (`/sounds/scan-success.wav`, `scan-fail.wav`) + fallback PCM/`Toolkit` (§9.3.1) |
| **P2.1d** | PIN vào Đăng ký + idle Enroll (`enroll.idleSeconds`) + idle đóng dialog PIN (`enroll.pinIdleSeconds`) — §9.3.2 |
| **P2.1e** | Admin cùng màn token: cột/API `enrollPin`; Đặt PIN; copy vào `enroll.pin` (§10.1) |
| **P2.1f** | OUT không có IN: tạo `attendance_records` + `check_out_at`; `status` nullable = CHƯA CHẤM (§4.4 A) |
| **P2.1g** | Có mặt hợp lệ = đủ 2 giờ; Admin điền ô trống + rule C (X); modal UI mockup §4.6; COMPLETED/KPI |
| **P2.1h** | Pre-prod harden: khóa sau submit (§4.7); HEAD whitelist (§4.8); bỏ khóa 06:00–16:00 HEAD (§4.9); tắt AI batch có mặt (§7); OUT-only banner Agent (§9.3.1); một `LATE_CUTOFF` (§4.10) |
| **P3** | UI HEAD/Admin cột vào/ra + Chi tiết quét (lớp A+B trên màn hiện có); khoảng ngày thủ công; báo cáo COMPLETED; đồng bộ KPI/Excel |
| **P3a** | `StaffAttendanceDto` checkIn/Out/source; `GET /attendance/scan-logs`; FE cột + ScanLogModal (HEAD + Admin Chi tiết Đơn vị) |
| **P3b** | Catalog seed `DI_TRE` (+ `THAI_SAN`); `sort_order` Đi làm → Đi trễ → …; KPI card đủ 6 status |
| **P3c** | KPI status card label: `font-bold` + `text-black` đồng bộ HEAD Chấm công |
| **P3d** | Khoảng ngày thủ công: modal Từ→Đến + `PUT /api/attendance/manual-range` (§3.2.1) |
| **P3e** | Modal **Lịch thủ công** theo NV + `GET /api/attendance/manual-schedule` (§3.2.2) |
| **P3f** | Harden quyền/UI: Admin Chi tiết ĐV = manual-range + soft clear (§4.11) + hint thiếu OUT (§4.5.1); `applyManualStatus` thống nhất batch/range (§4.8.1) |
| **P3g** | Admin Chi tiết ĐV: menu dropdown **Vân tay** gom Điền giờ / Chi tiết quét / Đưa về chưa chấm (§10.6) |
| **P2.2** | Agent/Web: `finger_label` bắt buộc; kiosk DELETE; ĐK lại R1 confirm ghi đè; 1 ngón active / NV; auth kiosk+PIN |
| **P2.3** | Chốt A: CRUD template **chỉ Agent** — bỏ Web HEAD/ADMIN DELETE template; Web chỉ GET status + `fingerLabel` |
| **P4a** | Agent: REJECTED + `message`; `device.autoOpen`; Startup; bat resolve `classes\production\…` (IntelliJ) rồi `out\` / `target` |
| **P4b** | LAN gate kiosk; native `java.library.path` + preflight DLL; preview reset đổi mode; Agent HTTP/scan off EDT + in-flight; server bỏ tin `scannedAt` + debounce 2s + upsert attendance; staff meta không LOB; 1 token active/khoa |
| **P4c** | Agent: open/close device + enroll/delete HTTP off EDT; preview in-memory; README IntelliJ VM = bat |
| **P4** | **Chốt A (ops):** dist JAR (không phụ thuộc IntelliJ); heartbeat Agent Online trên Admin; **watchdog** Task Scheduler tự mở lại khi crash. **Cấm** Windows Service mở Swing (session 0). Export báo cáo — phase riêng nếu cần |

---

## 14. Checklist merge

- [x] Đúng SPEC này; không invent ngoài yêu cầu  
- [x] Một nguồn DB cho Chấm công / thống kê / dashboard / báo cáo  
- [x] Rule C đúng; không còn phụ thuộc khóa sổ 06:00–16:00 cho HEAD/scan  
- [x] AI batch DI_LAM đã tắt API + UI (StatusPicker thủ công only)  
- [x] Không trả template public (kiosk token + Web không raw template; **P4b** LAN gate)  
- [x] Theme/responsive đúng rule hệ thống (Web Tailwind tokens; Agent hex theo SPEC UX)  
- [x] **P1.1:** `GET /api/kiosk/health` có `deptName`  
- [x] **P1.1:** Agent hiện Tổng / Đã ĐK / Chưa ĐK + lọc 3 trạng thái (mặc định Chưa ĐK)  
- [x] **P1.1:** Hủy đăng ký chỉ enable khi đang enroll  
- [x] **P1.1:** Dialog/status `Đăng ký thành công vân tay cho nhân viên {fullname}.` không bị reload ghi đè  
- [x] **P1.1:** Câu tải DS dùng `{deptName}`, không chữ “kiosk”  
- [x] **P1.1b:** Layout mockup (stepper, card quét, hàng Bắt đầu + Hủy) — không đổi API
- [x] **P1.1c:** Mép trái Đơn vị / Tổng / Lọc / Nhân viên thẳng hàng  
- [x] **P1.1c:** Không hover đổi màu nút; primary/secondary contrast đạt  
- [x] **P1.1c:** Sau enroll OK, stepper giữ **3 HOÀN TẤT** (không về 2 khi đóng dialog)
- [x] **P1.1d / P1.1h:** Logo trong app `/branding/biometrics.png` cạnh `VÂN TAY NHÂN VIÊN`; icon cửa sổ `/branding/hospital-logo.png` cạnh `Biometric Enroll`; **không** gọi branding Web

- [x] **P1.1e:** Chỉ số `Chưa đăng ký: n` màu đỏ `#EF4444`
- [x] **P1.1f:** `Tổng: n` màu `#001A4D`; `Đã đăng ký` primary
- [x] **P1.1f:** Nút `Tải DS nhân viên` solid navy `#001A4D` (không link)
- [x] **P1.1g:** Tải DS cùng hàng lọc (không cùng hàng Tổng)
- [x] **P1.1g:** Vertical spacing đều (`SECTION_GAP`)
- [x] **P1.1g:** Banner lỗi API dùng mã (`E-API-CONN` / …); không raw English
- [x] **P1.1g:** Bỏ badge `CHƯA KẾT NỐI` / `SẴN SÀNG`; giữ pill Máy + badge phiên quét
- [x] **P1.1h:** `setTitle` theo mode (`Biometric Attendance` / `Biometric Enroll`)
- [x] **P1.1h:** Label trong app = `VÂN TAY NHÂN VIÊN` (+ suffix mode)
- [x] **P1.1h:** App title thẳng mép trái content
- [x] **P1.1h:** Stepper căn giữa ngang
- [x] **P1.1i:** Mode Enroll: chưa Bắt đầu → không preview ảnh; banner cảnh báo (debounce ≥1s)
- [x] **P1.1i:** Hàng `Bắt đầu đăng ký` + `Hủy đăng ký` ngang; Hủy nút chữ đỏ; idle hiện + disabled
- [x] **P1.1i:** Agent mở maximized (`MAXIMIZED_BOTH`), không exclusive fullscreen
- [x] **P1.1j:** `SECTION_GAP=12`; scan card max ≤360; không stretch full viewport
- [x] **P1.1j:** Hàng Enroll `GridLayout(1,2)` — Bắt đầu / Hủy bằng nhau
- [x] **P1.1j:** Hủy nền `#EF4444` chữ trắng (danger solid); idle disabled nền `#FECACA`
- [x] **P1.1k:** Banner SUCCESS `#DEFBE8`/`#10B981`; WARNING `#FFFBEB`/`#F59E0B`; DANGER `#FEF2F2`/`#EF4444`; INFO primary
- [x] **P1.2:** Nav Cài đặt → Quản lý token vân tay (`settings-fingerprint-tokens`); ADMIN only
- [x] **P1.2:** API list / create / revoke / rotate; HEAD 403 (plaintext: xem P1.2c)
- [x] **P1.2:** Docs/ops §10.2 — Admin đổi `kiosk.token` trên Agent để enroll từng khoa
- [x] **P1.2:** FE imports từ `settings/`: `../shared/*`, `../../constants/admin`, `../../services/api`
- [x] **P1.2b:** 3 KPI (Tổng / Đang dùng / Đã thu hồi) + StatCard đồng bộ accounts
- [x] **P1.2b:** `RegistryTableShell` + `TablePagination` (client, `unitLabel=token`)
- [x] **P1.2b:** Bỏ header title/hint trang; CTA Phát hành cùng hàng **Danh sách token** (`btn-primary` + Plus)
- [x] **P1.2b:** Layout polish (KPI/shell); cột Token che → **superseded bởi P1.2c**
- [x] **P1.2b:** Cột trạng thái pill đồng bộ `AccountRow` (`badge-success` / `badge-neutral` + rounded-full)
- [x] **P1.2c:** Admin xem/copy plaintext token active (cột DB `token_plaintext` + GET list)
- [x] **P1.2c:** Dialog Phát hành / sau phát hành dùng `FormModal` (đồng bộ settings)
- [x] **P1.2c:** Dialog xác nhận Xoay = `FormModal`; Thu hồi = `DeleteModal` (không `window.confirm`)
- [x] **P1.2c:** Bootstrap YAML skip nếu `token_hash` đã tồn tại (kể cả revoked) — không crash UNIQUE
- [x] **P2.1:** Agent mode Chấm công (§9.3) + Identify 1 lần quét
- [x] **P2.1:** GET `/api/kiosk/fingerprints/templates` + POST `/api/kiosk/fingerprints/scan` (rule C + scan logs)
- [x] **P2.1a:** `zk_fid = emp_code` trên enroll/API/Agent load; Flyway V10 sync FID trùng
- [x] **P2.1a:** Banner nạp mẫu `Đã nạp {loaded}/{total}`; WARNING nếu thiếu mẫu
- [x] **P2.1b:** Badge `VÀO THÀNH CÔNG` / `RA THÀNH CÔNG`; bíp success/fail; `sound.enabled`
- [x] **P2.1b:** Beep PCM 44100 Hz + fallback `Toolkit.beep` khi LineUnavailable (Windows)
- [x] **P2.1b:** Layout Agent cột nội dung ≤960px căn giữa (desktop maximize)
- [x] **P2.1b:** Kết quả Chấm công **1 dòng** `{mã} - {tên} - {STATUS}` phía trên preview (ẩn meta trùng)
- [x] **P2.1c:** WAV kiosk `/sounds/scan-success.wav` + `scan-fail.wav`; Clip trước, fallback PCM/`Toolkit`
- [x] **P2.1d:** PIN bắt buộc khi vào Đăng ký; `enroll.idleSeconds` idle → về Chấm công
- [x] **P2.1d:** Dialog PIN idle `enroll.pinIdleSeconds` (mặc định 60) tự đóng → vẫn Chấm công
- [x] **P2.1e:** Cột/API `enrollPin` trên Quản lý token vân tay; FormModal Đặt PIN; revoke xóa / rotate giữ PIN
- [x] **P2.1f:** OUT-only tạo bản ghi ngày + giờ ra; `status` NULL (CHƯA CHẤM); Flyway nullable status
- [x] **P2.1g:** Có mặt hợp lệ đủ giờ vào+ra; Admin `PUT …/attendance/times` ô trống + rule C; KPI/COMPLETED
- [x] **P2.1g:** Modal Điền giờ UI mockup (banner, ô Đã có disabled, preview rule C, footer Hủy/Lưu)
- [x] **P2.1g:** Modal polish mockup 2 — grid 2 cột; badge trong ô; fingerprint tile + progress bar; asset FE `biometrics.png`
- [x] **P2.1h:** Scan + HEAD PUT khóa sau submit báo cáo; message VN §11
- [x] **P2.1h:** HEAD whitelist 4 status + không đè DI_LAM/DI_TRE (BE + FE disable quick-action)
- [x] **P2.1h:** `assertCanWrite` / FE bỏ khóa sổ 06:00–16:00 cho HEAD; ẩn LockBanner giờ
- [x] **P2.1h:** AI batch DI_LAM/DI_TRE reject; StatusPicker chỉ thủ công
- [x] **P2.1h:** Agent OUT-only banner `RA — CHƯA CÓ GIỜ VÀO` (WARNING + fail beep)
- [x] **P2.1h:** `FingerprintScanService` dùng `AttendanceValidity.LATE_CUTOFF`
- [x] **P3a:** DTO page có `checkInAt`/`checkOutAt`/`source`; full roster + null
- [x] **P3a:** `GET /api/attendance/scan-logs` (HEAD khoa mình / ADMIN mọi khoa); modal Chi tiết quét
- [x] **P3a:** FE cột giờ vào/ra trên Chấm công HEAD + Chi tiết Đơn vị Admin (không màn mới)
- [x] **P3b:** Flyway seed/upsert `DI_TRE` (+ `THAI_SAN`); sort_order ngay sau `DI_LAM`
- [x] **P3b:** Local `AttendanceStatusCatalogBootstrap` drop legacy `metric_key` + upsert (không INSERT P3b trong `data.sql`)
- [x] **P3b:** KPI HEAD/Admin hiện card Đi trễ bên phải Đi làm; quick-action loại trừ DI_LAM/DI_TRE
- [x] **P3b:** `AttendanceStatusProvider` bao AdminApp (dashboard + Chi tiết Đơn vị dùng catalog)
- [x] **P3c:** Nhãn card trạng thái KPI = `font-bold` + `text-black` (token chung; số vẫn semantic)
- [x] **P3d:** Modal khoảng ngày thủ công + `PUT /api/attendance/manual-range` (§3.2.1)
- [x] **P3d:** Skip ngày đã quét / đã submit (HEAD); max 366; clear giờ vào/ra khi gán thủ công
- [x] **P3d:** Subtitle `mã - tên`; bỏ hint dài; preview + cảnh báo bỏ qua ngày vân tay (không ghi đè)
- [x] **P3e:** Modal Lịch thủ công + GET manual-schedule; gộp khoảng ngày liên tiếp cùng status
- [x] **P3e:** Bộ lọc Từ–Đến do user chọn + nút Tìm; bỏ dòng “Khoảng xem” dễ nhầm
- [x] **P3e:** Tìm lại: thead cố định; nút Tìm không đổi icon/opacity
- [x] **P3f:** Admin Chi tiết ĐV — quick-action + manual-range (không khóa fingerprint trên FE Admin)
- [x] **P3f:** `POST /api/admin/attendance/clear` soft clear + `reason`; UI FormModal; không xóa scan logs
- [x] **P3f:** Hint `Thiếu giờ ra` (§4.5.1) HEAD + Admin
- [x] **P3f:** `applyManualStatus` — saveAttendance / batch / manual-range cùng clear giờ + `source=MANUAL`
- [x] **P3g:** Menu **Vân tay** dropdown trên Chi tiết ĐV (desktop + mobile); Lịch thủ công + quick-action giữ ngoài menu
- [x] **Sync SPEC:** `SPEC_HEAD` §16 khớp FINGERPRINT — ghi đè thủ công trong khoảng; clear sau submit không hủy submit
- [x] **§4.11 UI:** banner warning khi clear ngày đã gửi báo cáo
- [x] **P2.2:** Cột `finger_label` + enroll bắt buộc `fingerLabel`; Flyway V15 backfill
- [x] **P2.2:** `DELETE /api/kiosk/fingerprints/{empCode}` + nút Xóa trên Agent
- [x] **P2.2:** ĐK lại R1 confirm ghi đè; list kiosk/Web hiện `fingerLabel`
- [x] **P2.2:** Auth Agent vẫn kiosk token + PIN (không login HEAD/Admin)
- [x] **P2.3:** Bỏ `DELETE` template Web HEAD + ADMIN; FE ẩn nút xóa; CRUD mẫu chỉ Agent
- [x] **P4a / B1:** Banner REJECTED = `TỪ CHỐI — {message}` (§9.3.1)
- [x] **P4a:** `device.autoOpen` (+ retry) sau bootstrap; script Startup + runbook Agent
- [x] **P4a:** `start-agent.bat` ưu tiên `classes\production\ZKFinger Demo2` (+ `fingerprint-agent` / `out\` / scan) — marker `FingerprintAgentApp.class`
- [x] **B5:** Checklist P1.1–P1.1h đánh dấu đã ship (đồng bộ code)
- [x] **P4b:** `KioskLanGateFilter` + `app.security.kiosk.*` (prod on / local off)
- [x] **P4b:** Scan dùng giờ server (ignore `scannedAt`); debounce server 2s; upsert unique attendance
- [x] **P4b:** `GET /kiosk/staff` không load `template_base64`; phát hành token → 1 active/khoa
- [x] **P4b:** Agent preview reset khi đổi mode / hủy enroll
- [x] **P4b:** Agent scan/templates/staff HTTP off EDT; in-flight + debounce stamp trước POST
- [x] **P4b:** `start-agent.bat` library path gồm System32 + preflight `libzkfp.dll`
- [x] **P4c:** `openDevice` / `closeDevice` trên worker + `deviceOpInFlight`
- [x] **P4c:** enroll / delete HTTP trên worker; preview in-memory (không `fingerprint.bmp` CWD)
- [x] **P4c:** README IntelliJ VM options parity với bat
- [x] **P4:** `dist/fingerprint-agent.jar` + `build-agent-jar.ps1`; `start-agent.bat` ưu tiên JAR
- [x] **P4:** `POST /api/kiosk/heartbeat` + cột `last_heartbeat_at`; Admin `agentOnline` / cột Agent
- [x] **P4:** Agent heartbeat timer (`heartbeat.*` trong agent.properties)
- [x] **P4:** `watchdog-agent.ps1` + `install-watchdog.ps1` (Task Scheduler); **không** Windows Service UI
- [x] **P4:** SPEC §9.5 chốt A — Startup + watchdog + JAR + heartbeat
- [x] **P4:** Autostart/watchdog → `start-agent-silent.ps1` (`javaw`, ẩn CMD); `start-agent.bat` chỉ debug
- [x] **P4:** Silent start — `ProcessStartInfo` + library path chỉ `lib`+System32; verify process sống; detect cmdline `FingerprintAgentApp`/`fingerprint-agent.jar`
- [x] **P5:** Bỏ Gửi báo cáo khoa; khóa mềm `lockTime`; `GET …/missing-punches`; nhắc auto D−1; copy settings
- [x] **Trợ lý AI (sau P5):** Admin/HEAD missing-punch tools; bỏ framing nộp báo cáo — `SPEC_AI_ASSISTANT.md`


---

## 15. Phạm vi CẤM

- Quét trong browser / matching trên server không SDK  
- IntelliJ Demo2 làm production  
- Template ra Tailscale  
- HEAD gán/sửa DI_LAM/DI_TRE hoặc dữ liệu đã quét; HEAD xóa về chưa chấm  
- HEAD/ADMIN enroll hoặc xóa template vân tay qua Web (chỉ Agent + kiosk)  
- Giữ song song hai nguồn attendance lệch nhau  
- Để sót API/tool AI batch Đi làm  
- Tự ý thêm status/màn ngoài SPEC  
- Khôi phục khóa sổ 06:00–16:00 cho HEAD Chấm công mà không sửa lại SPEC

---

## 16. Đồng bộ xung đột đã xử lý + cải tiến bắt buộc khi implement

### 16.1 Xung đột đã chốt (không để sót khi code)

| Vấn đề | Quyết định |
|--------|------------|
| SPEC_ADMIN Completion cũ `markedCount` | Dùng định nghĩa 6 status (mục 4.5) |
| Lock flags / 06:00–16:00 trên HEAD | Bỏ; unlock Admin = legacy, không khóa Agent/báo cáo HEAD |
| AI batch DI_LAM | Tắt tool + reject API |
| Chart/Excel 4 màu cũ | P3 cập nhật đủ 6 status + giờ vào/ra |
| Hai nguồn DB | Cấm — một schema day-record + logs |
| Admin thiếu UI manual-range | P3f — Chi tiết ĐV + cùng API §3.2.1 |
| Soft clear “chưa chấm” | P3f §4.11 — soft + lý do; được sau submit (**không** hủy submit); không xóa logs |
| AI batch sót giờ quét | P3f §4.8.1 — `applyManualStatus` |
| Badge có mặt / KPI chưa đủ | P3f §4.5.1 — hint thiếu OUT; không nới HEAD |

### 16.2 Cải tiến vận hành (ghi SPEC — không invent thêm ngoài danh sách này)

1. **P5:** Bỏ nộp báo cáo khoa; khóa mềm `lockTime`; hàng đợi thiếu dữ liệu chấm công; nhắc D−1 theo exception — **đã chốt §4.5 / §4.7 / §4.9**.  
2. **Enroll ↔ Identify mutex** trên Agent: vào mode enroll thì tạm dừng identify; xong enroll → reload template khoa → identify lại.  
3. **Token kiosk**: xoay/thu hồi được từ Admin Web (§10.1); gắn 1 `deptCode`; không dùng chung mọi khoa. Admin enroll đa khoa bằng đổi `agent.properties` (§10.2).  
4. **Proxy LAN**: allowlist không chỉ literal `192.*` — cấu hình CIDR/trusted proxy header đã review (tránh chặn nhầm sau Nginx).  
5. **Realtime UI (tùy phase):** sau scan thành công, HEAD web refresh hàng (SSE/poll thưa 5–10s khi màn Chấm công mở) — không poll dày trên Tailscale. **Chưa bắt buộc P3f.**  
6. **Cảnh báo thiếu OUT** trên UI HEAD/Admin — **đã chốt §4.5.1 / P3f**.  
7. **Giới hạn khoảng ngày thủ công:** max 366; `from <= to` — **đã chốt §3.2.1 / P3d**.  
8. **Priority xung đột SPEC:** `SPEC_FINGERPRINT` > mục Chấm công trong `SPEC_HEAD` / `SPEC_ADMIN` khi nói vân tay / COMPLETED / khóa mềm.  
9. **Admin soft clear + lý do** — **đã chốt §4.11 / P3f**.  
10. **`applyManualStatus` một semantics** — **đã chốt §4.8.1 / P3f**.  
11. **Trợ lý AI** — sau P5: bỏ framing nộp báo cáo; Admin nhắc theo thiếu dữ liệu chấm công (D−1); HEAD `list_missing_punches` — binding `docs/SPEC_AI_ASSISTANT.md` + `PLAN_AI_ASSISTANT_P5.md`. UI **không** dùng từ “punch”.

### 16.3 Thứ tự ưu tiên sửa code legacy

1. P1 enroll + DB template  
2. **P1.1** Agent UX (§9.1): health `deptName`, lọc Đã/Chưa ĐK, chỉ số tổng, notice thành công, trạng thái nút Hủy  
2b. **P1.2** Admin Quản lý token vân tay (§10.1) + workflow đổi token Agent (§10.2)  
3. P2 day-record + logs + rule C + tắt AI batch + whitelist HEAD PUT  
4. P3 UI vào/ra, khoảng ngày, báo cáo, KPI/dashboard/Excel đồng bộ  
5. Gỡ/ẩn UX khóa sổ 06:00–16:00 trên HEAD; settings Admin bỏ copy “chốt sổ khóa HEAD”  
6. P4a–P4c + **P4** §9.5 (JAR + heartbeat + watchdog; không Service UI)  
