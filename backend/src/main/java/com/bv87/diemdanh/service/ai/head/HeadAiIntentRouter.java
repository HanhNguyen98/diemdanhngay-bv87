package com.bv87.diemdanh.service.ai.head;

import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Routes HEAD AI chat / quick actions — SPEC_AI_ASSISTANT. */
@Component
@RequiredArgsConstructor
public class HeadAiIntentRouter {

    private final VietnamTimeService timeService;

    public HeadAiIntent route(String quickAction, String message, LocalDate selectedDate) {
        LocalDate date = selectedDate != null ? selectedDate : timeService.today();
        if (quickAction != null && !quickAction.isBlank()) {
            return switch (quickAction) {
                case "batch_attendance" -> HeadAiIntent.builder()
                        .type(HeadAiIntent.Type.STATUS_PICKER)
                        .args(Map.of("scope", "unchecked_only", "date", date.toString()))
                        .replyHint("Bạn muốn chấm trạng thái nào cho nhân viên CHƯA CHẤM?")
                        .build();
                case "list_missing_punches" -> HeadAiIntent.builder()
                        .type(HeadAiIntent.Type.LIST_MISSING_PUNCHES)
                        .args(Map.of("date", date.toString()))
                        .replyHint("Đang lấy danh sách thiếu dữ liệu chấm công...")
                        .build();
                default -> routeMessage(message, date);
            };
        }
        return routeMessage(message, date);
    }

    private HeadAiIntent routeMessage(String message, LocalDate selectedDate) {
        if (message == null || message.isBlank()) {
            return HeadAiIntent.builder().type(HeadAiIntent.Type.GREETING).args(Map.of()).build();
        }

        String q = message.toLowerCase(Locale.ROOT).trim();
        if (containsAny(q, "chào", "xin chào", "hello", "giúp")) {
            return HeadAiIntent.builder().type(HeadAiIntent.Type.GREETING).args(Map.of()).build();
        }

        if (isMissingPunchQuery(q)) {
            return HeadAiIntent.builder()
                    .type(HeadAiIntent.Type.LIST_MISSING_PUNCHES)
                    .args(Map.of("date", selectedDate.toString()))
                    .replyHint("Đang lấy danh sách thiếu dữ liệu chấm công...")
                    .build();
        }

        if (isBatchAttendanceQuery(q) && containsAny(q, "đi làm", "di lam", "có mặt", "co mat", "đi trễ", "di tre")) {
            return HeadAiIntent.builder()
                    .type(HeadAiIntent.Type.UNKNOWN)
                    .args(Map.of())
                    .replyHint("Đi làm / Đi trễ chỉ ghi nhận qua vân tay.")
                    .build();
        }

        String status = resolveStatus(q);
        if (status != null && isBatchAttendanceQuery(q)) {
            Map<String, Object> args = new HashMap<>();
            args.put("date", selectedDate.toString());
            args.put("status", status);
            args.put("scope", isAllStaffQuery(q) ? "all_staff" : "unchecked_only");
            return HeadAiIntent.builder()
                    .type(HeadAiIntent.Type.BATCH_ATTENDANCE_EXECUTE)
                    .args(args)
                    .replyHint("Đang chuẩn bị xác nhận Chấm công hàng loạt...")
                    .build();
        }

        return HeadAiIntent.builder().type(HeadAiIntent.Type.UNKNOWN).args(Map.of()).build();
    }

    private boolean isMissingPunchQuery(String q) {
        return containsAny(q,
                "thiếu dữ liệu chấm công",
                "thiếu dữ liệu",
                "thiếu punch",
                "thiếu giờ ra",
                "thiếu giờ",
                "chưa chấm",
                "chưa đủ",
                "ai chưa",
                "nhân viên nào chưa");
    }

    private boolean isBatchAttendanceQuery(String q) {
        return containsAny(q,
                "chấm công",
                "cham cong",
                "diem danh",
                "điểm danh",
                "chấm hàng loạt",
                "chấm tất cả",
                "cho tất cả",
                "toàn bộ");
    }

    private boolean isAllStaffQuery(String q) {
        return containsAny(q, "tất cả", "toàn bộ", "cho tất cả", "all");
    }

    private String resolveStatus(String q) {
        if (containsAny(q, "đi làm", "di lam", "có mặt", "co mat", "đi trễ", "di tre")) {
            return null; // presence only via fingerprint — SPEC §7
        }
        if (containsAny(q, "nghỉ phép", "nghi phep", "vắng", "vang")) {
            return "NGHI_PHEP";
        }
        if (containsAny(q, "đi học", "di hoc")) {
            return "DI_HOC";
        }
        if (containsAny(q, "công tác", "cong tac")) {
            return "DI_CONG_TAC";
        }
        if (containsAny(q, "thai sản", "thai san")) {
            return "THAI_SAN";
        }
        return null;
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
