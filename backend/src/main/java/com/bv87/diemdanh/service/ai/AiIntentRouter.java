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

        if (isPendingDepartmentsQuery(q)) {
            LocalDate target = resolveMissingPunchDateFromMessage(message, q, today);
            return AiIntent.builder()
                    .type(AiIntent.Type.PENDING_DEPARTMENTS)
                    .args(Map.of("date", target.toString()))
                    .replyHint("Đang lấy danh sách ĐƠN VỊ thiếu dữ liệu chấm công...")
                    .build();
        }

        if (isBatchReminderQuery(q)) {
            LocalDate target = resolveMissingPunchDateFromMessage(message, q, today);
            return AiIntent.builder()
                    .type(AiIntent.Type.BATCH_REMINDERS)
                    .args(Map.of("date", target.toString()))
                    .replyHint("Đang quét các ĐƠN VỊ còn thiếu dữ liệu chấm công...")
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
            if (nlpParser.hasExplicitDate(message) || containsAny(q, "hôm nay", "sáng nay")) {
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

        return AiIntent.builder().type(AiIntent.Type.UNKNOWN).args(Map.of()).build();
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
                "trạng thái Chấm công",
                "báo cáo Chấm công",
                "file Chấm công",
                "xuất Chấm công",
                "Chấm công ngày");
    }

    private boolean isPendingDepartmentsQuery(String q) {
        return containsAny(q,
                "thiếu dữ liệu chấm công",
                "thiếu dữ liệu",
                "thiếu punch",
                "thiếu giờ ra",
                "thiếu giờ",
                "chưa chấm",
                "chưa Chấm công",
                "thiếu dữ liệu",
                "chưa báo cáo",
                "chưa nộp",
                "chưa xong",
                "ai chưa",
                "khoa nào chưa",
                "phòng nào chưa",
                "danh sách ĐƠN VỊ chưa");
    }

    private boolean isBatchReminderQuery(String q) {
        return containsAny(q,
                "gửi nhắc nhở",
                "nhắc nhở đồng loạt",
                "nhắc các khoa",
                "nhắc các phòng",
                "nhắc thiếu dữ liệu",
                "nhắc thiếu punch",
                "nhắc thiếu dữ liệu chấm công");
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
