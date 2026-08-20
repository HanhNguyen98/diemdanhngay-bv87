package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.AttendanceAuditLogItemDto;
import com.bv87.diemdanh.dto.AttendanceAuditLogPageDto;
import com.bv87.diemdanh.entity.AuditLog;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.repository.AuditLogRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.CodeFormatter;
import com.bv87.diemdanh.util.RequestClientInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void log(AuthUser authUser, String action, Map<String, Object> details) {
        logAttendance(authUser, action, authUser.getDeptCode(), null, null, details);
    }

    /**
     * Attendance web-action audit — SPEC P14 §4.7.1.
     */
    @Transactional
    public void logAttendance(
            AuthUser authUser,
            String action,
            Integer deptCode,
            Integer empCode,
            LocalDate attendanceDate,
            Map<String, Object> details) {
        try {
            AuditLog row = new AuditLog();
            row.setAction(action);
            row.setUsername(authUser.getUsername());
            row.setDeptCode(deptCode != null ? deptCode : authUser.getDeptCode());
            row.setEmpCode(empCode);
            row.setAttendanceDate(attendanceDate);
            row.setClientIp(RequestClientInfo.ip());
            row.setUserAgent(RequestClientInfo.userAgent());
            if (details != null && !details.isEmpty()) {
                row.setDetailsJson(objectMapper.writeValueAsString(details));
            }
            repository.save(row);
        } catch (Exception ex) {
            log.warn("Không ghi được audit log: {}", action, ex);
        }
    }

    @Transactional(readOnly = true)
    public AttendanceAuditLogPageDto listAttendanceLogs(
            AuthUser authUser,
            LocalDate from,
            LocalDate to,
            Integer deptCode,
            String username,
            int page,
            int pageSize) {
        if (!authUser.isAdmin() && !authUser.isHead()) {
            throw new AccessDeniedException("Không có quyền xem nhật ký thao tác");
        }
        Integer scopedDept = deptCode;
        String scopedUser = username != null && !username.isBlank() ? username.trim() : null;
        if (authUser.isHead()) {
            scopedDept = authUser.getDeptCode();
            scopedUser = null;
        }
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate today = LocalDate.now(zone);
        LocalDate fromDate = from != null ? from : today.minusDays(30);
        LocalDate toDate = to != null ? to : today;
        if (toDate.isBefore(fromDate)) {
            toDate = fromDate;
        }
        int size = Math.min(Math.max(pageSize, 1), 100);
        int pageIndex = Math.max(page - 1, 0);
        Page<AuditLog> result = repository.searchAttendanceLogs(
                fromDate.atStartOfDay(zone).toInstant(),
                toDate.plusDays(1).atStartOfDay(zone).toInstant(),
                scopedDept,
                scopedUser,
                PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return AttendanceAuditLogPageDto.builder()
                .items(result.getContent().stream().map(this::toItem).toList())
                .page(pageIndex + 1)
                .pageSize(size)
                .totalItems(result.getTotalElements())
                .totalPages(Math.max(result.getTotalPages(), 1))
                .build();
    }

    private AttendanceAuditLogItemDto toItem(AuditLog row) {
        return AttendanceAuditLogItemDto.builder()
                .id(row.getId())
                .createdAt(row.getCreatedAt())
                .username(row.getUsername())
                .deptCode(row.getDeptCode())
                .deptCodeFormatted(row.getDeptCode() != null ? CodeFormatter.formatDeptCode(row.getDeptCode()) : null)
                .empCode(row.getEmpCode())
                .empCodeFormatted(row.getEmpCode() != null ? CodeFormatter.formatEmpCode(row.getEmpCode()) : null)
                .attendanceDate(row.getAttendanceDate())
                .action(row.getAction())
                .actionLabel(actionLabel(row.getAction()))
                .clientIp(row.getClientIp())
                .userAgent(row.getUserAgent())
                .detailsJson(row.getDetailsJson())
                .build();
    }

    private static String actionLabel(String action) {
        if (action == null) {
            return "";
        }
        return switch (action) {
            case "ATTENDANCE_MANUAL_RANGE" -> "Gán trạng thái khoảng ngày";
            case "ATTENDANCE_NGHI_TRUC" -> "Chấm nghỉ trực";
            case "ATTENDANCE_SAVE" -> "Lưu chấm công";
            case "ATTENDANCE_FILL_TIMES" -> "Điền giờ";
            case "ATTENDANCE_PAYROLL_APPROVE" -> "Duyệt bổ sung giờ";
            case "ATTENDANCE_CLEAR" -> "Xóa về chưa chấm";
            case "ATTENDANCE_UNLOCK" -> "Mở khóa ngày công";
            case "ATTENDANCE_RELOCK" -> "Thu hồi mở khóa";
            case "ATTENDANCE_UNLOCK_REQUEST" -> "Gửi yêu cầu mở khóa";
            case "ATTENDANCE_UNLOCK_APPROVE" -> "Xác nhận mở khóa";
            case "ATTENDANCE_UNLOCK_REJECT" -> "Từ chối mở khóa";
            default -> action;
        };
    }
}
