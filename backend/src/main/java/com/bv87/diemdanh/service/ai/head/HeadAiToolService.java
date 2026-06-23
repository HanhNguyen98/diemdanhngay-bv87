package com.bv87.diemdanh.service.ai.head;

import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.AttendanceService;
import com.bv87.diemdanh.service.AuditService;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HeadAiToolService {

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

    public Map<String, Object> executeTool(AuthUser authUser, String tool, Map<String, Object> params) {
        Map<String, Object> args = params != null ? params : Map.of();
        return switch (tool) {
            case "batch_attendance" -> previewBatchAttendance(authUser, args);
            default -> throw new BusinessException("Tool không được hỗ trợ: " + tool);
        };
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
            throw new BusinessException("Thiếu trạng thái Điểm danh");
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
