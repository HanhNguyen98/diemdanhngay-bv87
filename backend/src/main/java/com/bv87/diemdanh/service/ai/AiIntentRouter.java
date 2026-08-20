package com.bv87.diemdanh.service.ai;

import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Routes Admin AI chat / quick actions — SPEC_AI_ASSISTANT. */
@Component
@RequiredArgsConstructor
public class AiIntentRouter {

    /** Shown when free-text cannot be routed — SPEC §2.2 P6-AiNlp. */
    static final String UNKNOWN_REPLY =
            "Xin lỗi, tôi chưa hiểu rõ yêu cầu này! "
                    + "Bạn có thể bấm một trong các nút gợi ý bên dưới, hoặc thử hỏi cụ thể như: "
                    + "\"Báo cáo trạng thái làm việc hôm nay\", "
                    + "\"Xuất báo cáo Chấm công ngày hôm qua\", "
                    + "\"Khoa nào thiếu dữ liệu chấm công hôm qua?\", "
                    + "\"Gửi nhắc nhở các khoa thiếu dữ liệu chấm công\".";

    static final String VAGUE_REPORT_REPLY =
            "Bạn muốn xem báo cáo nào? "
                    + "Hãy bấm nút Báo cáo trạng thái làm việc hoặc Báo cáo trạng thái Chấm công, "
                    + "hoặc nói rõ ngày — ví dụ: \"Xuất báo cáo Chấm công ngày hôm qua\".";

    static final String SUBMIT_REPORT_REPLY =
            "Trợ lý AI không theo dõi việc nộp báo cáo! "
                    + "Tôi chỉ hỗ trợ xem ĐƠN VỊ thiếu dữ liệu chấm công và gửi nhắc nhở. "
                    + "Hãy thử: \"Khoa nào thiếu dữ liệu chấm công hôm qua?\" hoặc bấm Nhắc thiếu dữ liệu chấm công.";

    private final AiDeptDictionary deptDictionary;
    private final AiNlpParser nlpParser;
    private final VietnamTimeService timeService;

    public AiIntent route(String quickAction, String message) {
        return route(quickAction, message, null);
    }

    /**
     * @param preferredDate optional ISO date from FE (e.g. CTA from pending list) — SPEC §2.1
     */
    public AiIntent route(String quickAction, String message, LocalDate preferredDate) {
        if (quickAction != null && !quickAction.isBlank()) {
            LocalDate missingDate = preferredDate != null ? preferredDate : defaultMissingPunchDate();
            return switch (quickAction) {
                case "work_status_report" -> AiIntent.builder()
                        .type(AiIntent.Type.WORK_STATUS_PICKER)
                        .args(Map.of())
                        .replyHint(null)
                        .build();
                case "attendance_status_report" -> AiIntent.builder()
                        .type(AiIntent.Type.ATTENDANCE_DATE_PICKER)
                        .args(Map.of())
                        .replyHint(null)
                        .build();
                case "batch_reminders", "remind_missing_punch_depts" -> AiIntent.builder()
                        .type(AiIntent.Type.BATCH_REMINDERS)
                        .args(Map.of("date", missingDate.toString()))
                        .replyHint("Đang quét các ĐƠN VỊ còn thiếu dữ liệu chấm công...")
                        .build();
                case "list_missing_punches", "list_pending_departments" -> AiIntent.builder()
                        .type(AiIntent.Type.PENDING_DEPARTMENTS)
                        .args(Map.of("date", missingDate.toString()))
                        .replyHint("Đang lấy danh sách ĐƠN VỊ thiếu dữ liệu chấm công...")
                        .build();
                default -> routeMessage(message);
            };
        }
        return routeMessage(message);
    }

    private AiIntent routeMessage(String message) {
        if (message == null || message.isBlank()) {
            return AiIntent.builder().type(AiIntent.Type.GREETING).args(Map.of()).build();
        }
        String q = message.toLowerCase(Locale.ROOT).trim();
        LocalDate today = timeService.today();

        // Reminder before list — SPEC §2.2 P6-AiNlp
        if (isBatchReminderQuery(q)) {
            LocalDate target = resolveMissingPunchDateFromMessage(message, q, today);
            return AiIntent.builder()
                    .type(AiIntent.Type.BATCH_REMINDERS)
                    .args(Map.of("date", target.toString()))
                    .replyHint("Đang quét các ĐƠN VỊ còn thiếu dữ liệu chấm công...")
                    .build();
        }

        if (isPendingDepartmentsQuery(q)) {
            LocalDate target = resolveMissingPunchDateFromMessage(message, q, today);
            return AiIntent.builder()
                    .type(AiIntent.Type.PENDING_DEPARTMENTS)
                    .args(Map.of("date", target.toString()))
                    .replyHint("Đang lấy danh sách ĐƠN VỊ thiếu dữ liệu chấm công...")
                    .build();
        }

        if (isWorkStatusQuery(q)) {
            Map<String, Object> args = new HashMap<>();
            LocalDate[] range = nlpParser.parseDateRange(message, today);
            args.put("fromDate", range[0].toString());
            args.put("toDate", range[1].toString());
            Integer deptCode = deptDictionary.resolveDeptCode(message);
            if (deptCode != null) {
                args.put("deptCode", deptCode);
            }
            boolean hasTimeframe = nlpParser.hasExplicitDate(message)
                    || containsAny(q, "hôm nay", "sáng nay", "hôm qua", "tuần này", "tháng này");
            if (hasTimeframe || deptDictionary.mentionsDepartment(message)) {
                return AiIntent.builder()
                        .type(AiIntent.Type.WORK_STATUS_EXECUTE)
                        .args(args)
                        .replyHint("Đang tổng hợp báo cáo trạng thái làm việc...")
                        .build();
            }
            return AiIntent.builder()
                    .type(AiIntent.Type.WORK_STATUS_PICKER)
                    .args(args)
                    .replyHint(null)
                    .build();
        }

        if (isAttendanceStatusQuery(q)) {
            if (nlpParser.hasExplicitDate(message) || containsAny(q, "hôm nay", "sáng nay", "hôm qua")) {
                LocalDate date = nlpParser.parseDate(message, today);
                return AiIntent.builder()
                        .type(AiIntent.Type.ATTENDANCE_STATUS_EXECUTE)
                        .args(Map.of("date", date.toString()))
                        .replyHint("Đang xuất báo cáo trạng thái Chấm công...")
                        .build();
            }
            return AiIntent.builder()
                    .type(AiIntent.Type.ATTENDANCE_DATE_PICKER)
                    .args(Map.of())
                    .replyHint(null)
                    .build();
        }

        if (containsAny(q, "chào", "xin chào", "hello", "giúp")) {
            return AiIntent.builder().type(AiIntent.Type.GREETING).args(Map.of()).build();
        }

        return resolveUnknownIntent(q);
    }

    private AiIntent resolveUnknownIntent(String q) {
        if (containsAny(q, "nộp báo cáo", "gửi báo cáo", "báo cáo cho admin", "head chưa nộp")) {
            return unknown(SUBMIT_REPORT_REPLY);
        }
        if (containsAny(q, "báo cáo", "thống kê", "xuất file", "excel")) {
            return unknown(VAGUE_REPORT_REPLY);
        }
        if (containsAny(q, "nhắc", "nhắc nhở")) {
            return unknown(
                    "Bạn muốn gửi nhắc nhở các ĐƠN VỊ thiếu dữ liệu chấm công? "
                            + "Hãy bấm Nhắc thiếu dữ liệu chấm công "
                            + "hoặc nói: \"Gửi nhắc nhở các khoa thiếu dữ liệu chấm công hôm qua\".");
        }
        return unknown(UNKNOWN_REPLY);
    }

    private AiIntent unknown(String reply) {
        return AiIntent.builder()
                .type(AiIntent.Type.UNKNOWN)
                .args(Map.of())
                .replyHint(reply)
                .build();
    }

    private LocalDate defaultMissingPunchDate() {
        return timeService.today().minusDays(1);
    }

    /** Default D−1; “hôm nay” or explicit date overrides. */
    private LocalDate resolveMissingPunchDateFromMessage(String message, String q, LocalDate today) {
        if (containsAny(q, "hôm nay", "sáng nay")) {
            return today;
        }
        if (nlpParser.hasExplicitDate(message) || containsAny(q, "hôm qua")) {
            return nlpParser.parseDate(message, today);
        }
        return today.minusDays(1);
    }

    private boolean isWorkStatusQuery(String q) {
        return containsAny(q,
                "trạng thái làm việc",
                "tình hình làm việc",
                "báo cáo làm việc",
                "làm việc hôm nay",
                "làm việc sáng nay");
    }

    private boolean isAttendanceStatusQuery(String q) {
        return containsAny(q,
                "trạng thái chấm công",
                "báo cáo chấm công",
                "file chấm công",
                "xuất chấm công",
                "chấm công ngày");
    }

    private boolean isPendingDepartmentsQuery(String q) {
        return containsAny(q,
                "thiếu dữ liệu chấm công",
                "thiếu dữ liệu",
                "thiếu punch",
                "thiếu giờ ra",
                "thiếu giờ",
                "chưa chấm",
                "chưa chấm công",
                "chưa báo cáo",
                "chưa nộp",
                "chưa xong",
                "ai chưa",
                "khoa nào chưa",
                "phòng nào chưa",
                "đơn vị nào chưa",
                "danh sách đơn vị");
    }

    private boolean isBatchReminderQuery(String q) {
        return containsAny(q,
                "gửi nhắc nhở",
                "nhắc nhở đồng loạt",
                "nhắc các khoa",
                "nhắc các phòng",
                "nhắc thiếu dữ liệu",
                "nhắc thiếu punch",
                "nhắc thiếu dữ liệu chấm công",
                "nhắc nhở thiếu");
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
