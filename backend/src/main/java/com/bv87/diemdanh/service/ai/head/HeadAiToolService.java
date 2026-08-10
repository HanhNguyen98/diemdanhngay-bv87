package com.bv87.diemdanh.service.ai.head;

import com.bv87.diemdanh.dto.MissingPunchItemDto;
import com.bv87.diemdanh.dto.MissingPunchesResponseDto;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.AttendanceService;
import com.bv87.diemdanh.service.AuditService;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** HEAD AI tools — SPEC_AI_ASSISTANT. */
@Service
@RequiredArgsConstructor
public class HeadAiToolService {

    private static final DateTimeFormatter DMY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AttendanceService attendanceService;
    private final AuditService auditService;
    private final VietnamTimeService timeService;

    @Transactional
    public Map<String, Object> previewBatchAttendance(AuthUser authUser, Map<String, Object> args) {
        LocalDate date = dateArg(args, "date", timeService.today());
        String status = statusArg(args, "status");
        String scope = stringArg(args, "scope", "unchecked_only");
        return attendanceService.previewBatchAttendance(authUser, date, status, scope);
    }

    @Transactional
    public Map<String, Object> confirmBatchAttendance(AuthUser authUser, String actionId) {
        Map<String, Object> result = attendanceService.confirmBatchAttendance(authUser, actionId);
        auditService.log(authUser, "HEAD_AI_BATCH_ATTENDANCE", Map.of(
                "actionId", actionId,
                "updated", result.get("updated"),
                "date", result.get("date"),
                "status", result.get("status")));
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listMissingPunches(AuthUser authUser, Map<String, Object> args) {
        LocalDate date = dateArg(args, "date", timeService.today());
        MissingPunchesResponseDto response =
                attendanceService.listMissingPunches(authUser, null, date);

        List<Map<String, Object>> items = new ArrayList<>();
        for (MissingPunchItemDto item : response.getItems()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("empCode", item.getEmpCode());
            row.put("empCodeFormatted", item.getEmpCodeFormatted());
            row.put("fullName", item.getFullName());
            row.put("status", item.getStatus());
            row.put("statusLabel", item.getStatusLabel());
            row.put("reason", item.getReason());
            row.put("reasonLabel", reasonLabel(item.getReason()));
            row.put("checkInAt", item.getCheckInAt() != null ? item.getCheckInAt().toString() : null);
            row.put("checkOutAt", item.getCheckOutAt() != null ? item.getCheckOutAt().toString() : null);
            items.add(row);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", date.toString());
        result.put("dateFormatted", DMY.format(date));
        result.put("items", items);
        result.put("total", items.size());
        long checkout = items.stream().filter(i -> "MISSING_CHECK_OUT".equals(i.get("reason"))).count();
        long unmarked = items.stream().filter(i -> "UNMARKED".equals(i.get("reason"))).count();
        result.put("missingCheckoutCount", checkout);
        result.put("unmarkedCount", unmarked);
        return result;
    }

    public Map<String, Object> executeTool(AuthUser authUser, String tool, Map<String, Object> params) {
        Map<String, Object> args = params != null ? params : Map.of();
        return switch (tool) {
            case "batch_attendance" -> previewBatchAttendance(authUser, args);
            case "list_missing_punches" -> listMissingPunches(authUser, args);
            default -> throw new BusinessException("Tool không được hỗ trợ: " + tool);
        };
    }

    private static String reasonLabel(String reason) {
        if ("MISSING_CHECK_OUT".equals(reason)) {
            return "Thiếu giờ ra";
        }
        if ("UNMARKED".equals(reason)) {
            return "Chưa chấm";
        }
        return reason != null ? reason : "";
    }

    private LocalDate dateArg(Map<String, Object> args, String key, LocalDate defaultValue) {
        Object value = args.get(key);
        if (value == null) {
            return defaultValue;
        }
        return LocalDate.parse(value.toString());
    }

    private String statusArg(Map<String, Object> args, String key) {
        Object value = args.get(key);
        if (value == null) {
            throw new BusinessException("Thiếu trạng thái Chấm công");
        }
        return value.toString();
    }

    private String stringArg(Map<String, Object> args, String key, String defaultValue) {
        Object value = args.get(key);
        if (value == null) {
            return defaultValue;
        }
        return value.toString();
    }
}
