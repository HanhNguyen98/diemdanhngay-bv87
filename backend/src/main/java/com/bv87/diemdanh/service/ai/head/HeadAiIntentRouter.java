package com.bv87.diemdanh.service.ai.head;

import com.bv87.diemdanh.entity.AttendanceStatus;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class HeadAiIntentRouter {

    private final VietnamTimeService timeService;

    public HeadAiIntent route(String quickAction, String message) {
        if (quickAction != null && !quickAction.isBlank()) {
            return switch (quickAction) {
                case "batch_attendance" -> HeadAiIntent.builder()
                        .type(HeadAiIntent.Type.STATUS_PICKER)
                        .args(Map.of("scope", "unchecked_only"))
                        .replyHint("Bạn muốn chấm trạng thái nào cho nhân viên chưa xác nhận?")
                        .build();
                default -> routeMessage(message);
            };
        }
        return routeMessage(message);
    }

    private HeadAiIntent routeMessage(String message) {
        if (message == null || message.isBlank()) {
            return HeadAiIntent.builder().type(HeadAiIntent.Type.GREETING).args(Map.of()).build();
        }

        String q = message.toLowerCase(Locale.ROOT).trim();
        if (containsAny(q, "chào", "xin chào", "hello", "giúp")) {
            return HeadAiIntent.builder().type(HeadAiIntent.Type.GREETING).args(Map.of()).build();
        }

        AttendanceStatus status = resolveStatus(q);
        if (status != null && isBatchAttendanceQuery(q)) {
            Map<String, Object> args = new HashMap<>();
            args.put("date", timeService.today().toString());
            args.put("status", status.name());
            args.put("scope", isAllStaffQuery(q) ? "all_staff" : "unchecked_only");
            return HeadAiIntent.builder()
                    .type(HeadAiIntent.Type.BATCH_ATTENDANCE_EXECUTE)
                    .args(args)
                    .replyHint("Đang chuẩn bị xác nhận chấm công hàng loạt...")
                    .build();
        }

        return HeadAiIntent.builder().type(HeadAiIntent.Type.UNKNOWN).args(Map.of()).build();
    }

    private boolean isBatchAttendanceQuery(String q) {
        return containsAny(q,
                "chấm công",
                "cham cong",
                "điểm danh",
                "diem danh",
                "chấm hàng loạt",
                "chấm tất cả",
                "cho tất cả",
                "toàn bộ");
    }

    private boolean isAllStaffQuery(String q) {
        return containsAny(q, "tất cả", "toàn bộ", "cho tất cả", "all");
    }

    private AttendanceStatus resolveStatus(String q) {
        if (containsAny(q, "đi làm", "di lam", "có mặt", "co mat")) {
            return AttendanceStatus.DI_LAM;
        }
        if (containsAny(q, "nghỉ phép", "nghi phep", "vắng", "vang")) {
            return AttendanceStatus.NGHI_PHEP;
        }
        if (containsAny(q, "đi học", "di hoc")) {
            return AttendanceStatus.DI_HOC;
        }
        if (containsAny(q, "công tác", "cong tac")) {
            return AttendanceStatus.DI_CONG_TAC;
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
