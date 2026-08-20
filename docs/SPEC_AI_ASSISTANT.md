# SPEC — Trợ lý AI (sau P5)

> Binding: `SPEC_FINGERPRINT` §4.5 / §4.5.2 / §4.7 · `PLAN_AI_ASSISTANT_P5.md`  
> UI: nút **Trợ lý AI** (Admin `ClinicalFlowPanel` · HEAD `HeadFlowPanel`)

## 1. Mục tiêu

| Vai trò | Được làm | Không làm |
|---------|----------|-----------|
| HEAD | Liệt kê thiếu dữ liệu chấm công khoa (ngày đang xem); batch ngoại lệ thủ công (whitelist) | Gửi báo cáo; batch `DI_LAM`/`DI_TRE` |
| ADMIN | Báo cáo thống kê; liệt kê / nhắc ĐƠN VỊ còn thiếu dữ liệu chấm công (mặc định **D−1**) | Yêu cầu HEAD “nộp báo cáo hôm nay” |

## 2. Admin AI — tools

Base: `/api/admin/ai`

| Tool id | Mục đích | Nguồn dữ liệu |
|---------|----------|---------------|
| `work_status_report` | Báo cáo trạng thái làm việc (khoảng ngày) | Aggregate records |
| `attendance_status_report` | Báo cáo Chấm công theo ngày | Summaries (KPI đủ status) |
| `list_missing_punches` | Danh sách ĐƠN VỊ còn thiếu dữ liệu chấm công | `AttendanceService.listMissingPunches*` |
| `remind_missing_punch_depts` | Preview nhắc → confirm | Cùng nguồn missing-punches |
| `list_pending_departments` | **Alias** → `list_missing_punches` (tương thích FE cũ) | |
| `batch_reminders` | **Alias** → `remind_missing_punch_depts` | |

### 2.1 Ngày mục tiêu nhắc / list

- Mặc định: **hôm qua** (`today − 1`, Asia/Ho_Chi_Minh) — khớp auto reminder P5.
- Có thể truyền `date` (ISO) khi NLP có “hôm nay” / ngày cụ thể.
- Confirm: `POST /tools/confirm-reminders` — `actionId` gắn `attendanceDate` + `deptCodes`; gửi đúng ngày đó.
- **CTA từ `pending_dept_table`:** phải truyền `date` = `payload.date` (không reset về D−1).

### 2.2 Copy / NLP (Vietnamese)

- **Cấm** framing “chưa báo cáo / chưa nộp / gửi báo cáo”.
- Dùng trên UI/API message: “thiếu dữ liệu chấm công”, “thiếu giờ ra”, “chưa chấm”. **Cấm** từ “punch” trên text người dùng.
- NLP vẫn nhận câu cũ (“chưa báo cáo”, “thiếu punch”) nhưng **reply/UI chỉ** tiếng Việt; không submit.
- Greeting FE/BE: nhắc mặc định **hôm qua**; `reminderHint` theo `dateFormatted` thực tế.

**NLP routing (P6-AiNlp):**

- Thứ tự free-text Admin: **nhắc / gửi nhắc** (`BATCH_REMINDERS`) **trước** liệt kê thiếu dữ liệu (`PENDING_DEPARTMENTS`) — tránh câu “nhắc thiếu dữ liệu chấm công” rơi nhầm sang xem danh sách.
- Needle Admin **lowercase** sau `toLowerCase` (`chấm công`, không `Chấm công`) — đồng bộ §3.2 HEAD.
- **Chip Admin:** thêm **「Đơn vị thiếu dữ liệu」** → `list_missing_punches` (bảng + CTA nhắc).
- **Intent không rõ / chưa training:** trả lời **cảm thán hướng dẫn** (tiếng Việt) — gợi ý nút chip + 1–2 câu mẫu; **không** im lặng / không widget lạ.
  - Admin ví dụ: *“Xin lỗi, tôi chưa hiểu rõ yêu cầu này! …”*
  - HEAD — chỉ nói “chấm công” không kèm trạng thái: hướng dẫn bấm **Chấm công hàng loạt** hoặc nói rõ nghỉ phép / đi học / …

### 2.3 Reminder dispatch (P5 fix)

- Không bỏ qua ĐƠN VỊ chỉ vì `CompletionStatus.COMPLETED` (có thể vẫn `MISSING_CHECK_OUT`).
- Chỉ gửi nếu ĐƠN VỊ còn item trong hàng đợi thiếu dữ liệu chấm công ngày mục tiêu.

## 3. HEAD AI — tools

Base: `/api/head/ai`

| Tool id | Mục đích |
|---------|----------|
| `list_missing_punches` | Hàng đợi thiếu dữ liệu chấm công khoa mình; `date` = ngày đang xem trên Web (body chat / params) |
| `batch_attendance` | Preview/confirm ngoại lệ thủ công — **giữ**; cấm presence |

| Endpoint | Ghi chú |
|----------|---------|
| `POST /chat/stream` | Optional `date` trên `AiChatRequest` |
| `POST /tools/execute` | Tools trên |
| `POST /tools/confirm-batch-attendance` | Chỉ manual whitelist |

UI khóa mềm / `reportBlocked` / màn ngoài Chấm công (`tableDisabled`): **cho phép** xem thiếu dữ liệu; **chặn** batch / status picker / confirm ghi (chip + free-text intent ghi).

### 3.1 FAB global (HEAD)

- Mount `HeadFlowPanel` tại `Dashboard` (mọi màn HEAD) — **không** chỉ `AttendancePage`.
- Bridge session: màn Chấm công đăng ký `selectedDate` / soft-lock / `onBatchComplete`; rời màn → date hôm nay + chặn batch.
- Admin FAB vẫn mount tại `AdminApp` (không đổi).
- Đổi mật khẩu / mọi màn scroll: `max-lg:pb-24` (hoặc tương đương) tránh FAB che nội dung.

### 3.2 Khóa ghi (UAT harden)

- `AttendanceLockService.assertCanWrite`: soft-lock **và** `reportBlocked` (Admin khóa chỉnh sửa khoa) — một nguồn sự thật cho Web + AI.
- Stream HEAD: intent `STATUS_PICKER` / `BATCH_ATTENDANCE_EXECUTE` gọi `assertCanWrite` trước khi emit widget.
- NLP: needles so khớp **sau** `toLowerCase` (`chấm công`, `cham cong`, …) — không dùng chữ hoa trong needle.

## 4. UI widgets

| Widget | Vai trò |
|--------|---------|
| `pending_dept_table` | Admin: ĐƠN VỊ thiếu dữ liệu chấm công + CTA nhắc (**có `date`**) |
| `reminder_confirm` | Admin: checkbox xác nhận gửi |
| `missing_punch_list` | HEAD: danh sách NV + lý do (`INCOMPLETE_PUNCHES` / `MISSING_EARLY_LEAVE_REASON` / `UNMARKED` — §4.5.2) |
| `status_picker` / `batch_attendance_confirm` | HEAD batch ngoại lệ |

Constants: `frontend/src/constants/aiAssistant.js`, `headAiAssistant.js`.

## 5. Checklist

- [x] SPEC này + cập nhật `SPEC_HEAD` §10 / `SPEC_ADMIN` §10 / `SPEC_FINGERPRINT` §16.2 mục 11
- [x] BE Admin: missing-punches tools + reminder date + không skip COMPLETED
- [x] BE HEAD: `list_missing_punches` + intent/NLP
- [x] FE copy + widgets; HEAD không block list khi soft-lock
- [x] FE: FAB HEAD mount `Dashboard` (mọi màn); bridge session từ Chấm công
- [x] QA copy: UI/API message không dùng từ “punch” (giữ needle NLP cũ)
- [x] UAT harden: CTA nhắc giữ `date`; `assertCanWrite` + `reportBlocked`; NLP casing; free-text write gate; greeting/hint; `pb-24` Đổi MK
- [x] **P6-AiNlp:** Admin NLP — nhắc trước list; needle lowercase; chip 「Đơn vị thiếu dữ liệu」; UNKNOWN cảm thán hướng dẫn (Admin + HEAD)
