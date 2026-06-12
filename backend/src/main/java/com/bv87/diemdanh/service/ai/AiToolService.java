package com.bv87.diemdanh.service.ai;

import com.bv87.diemdanh.dto.AttendanceSummaryDto;
import com.bv87.diemdanh.dto.SendReminderResultDto;
import com.bv87.diemdanh.dto.ai.AiReminderPreviewDeptDto;
import com.bv87.diemdanh.entity.AttendanceStatus;
import com.bv87.diemdanh.entity.CompletionStatus;
import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AttendanceRecordRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.AttendanceReminderService;
import com.bv87.diemdanh.service.AttendanceService;
import com.bv87.diemdanh.util.CodeFormatter;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiToolService {

    private static final DateTimeFormatter DMY = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int MAX_REPORT_DAYS = 90;

    private final AttendanceService attendanceService;
    private final AttendanceReminderService attendanceReminderService;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final DepartmentRepository departmentRepository;
    private final AiPendingActionStore pendingActionStore;
    private final VietnamTimeService timeService;

    @Transactional(readOnly = true)
    public Map<String, Object> buildWorkStatusReport(AuthUser authUser, Map<String, Object> args) {
        LocalDate from = dateArg(args, "fromDate", timeService.today());
        LocalDate to = dateArg(args, "toDate", from);
        if (to.isBefore(from)) {
            throw new BusinessException("Khoảng thời gian không hợp lệ");
        }
        if (ChronoUnit.DAYS.between(from, to) > MAX_REPORT_DAYS) {
            throw new BusinessException("Khoảng thời gian tối đa " + MAX_REPORT_DAYS + " ngày");
        }
        Integer deptCode = intOrNull(args, "deptCode");

        List<Department> departments = deptCode != null
                ? List.of(departmentRepository.findById(deptCode)
                        .orElseThrow(() -> new BusinessException("Không tìm thấy Đơn vị")))
                : departmentRepository.findAll();

        Map<Integer, long[]> countsByDept = new HashMap<>();
        for (Object[] aggregate : attendanceRecordRepository.aggregateWorkStatusByDept(from, to, deptCode)) {
            Integer code = (Integer) aggregate[0];
            AttendanceStatus status = (AttendanceStatus) aggregate[2];
            long count = (Long) aggregate[3];
            long[] counts = countsByDept.computeIfAbsent(code, ignored -> new long[4]);
            switch (status) {
                case DI_LAM -> counts[0] = count;
                case NGHI_PHEP -> counts[1] = count;
                case DI_HOC -> counts[2] = count;
                case DI_CONG_TAC -> counts[3] = count;
            }
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Department dept : departments) {
            long[] counts = countsByDept.getOrDefault(dept.getDeptCode(), new long[4]);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("deptCode", dept.getDeptCode());
            row.put("deptCodeFormatted", CodeFormatter.formatDeptCode(dept.getDeptCode()));
            row.put("deptName", dept.getDeptName());
            row.put("diLam", counts[0]);
            row.put("nghiPhep", counts[1]);
            row.put("diHoc", counts[2]);
            row.put("diCongTac", counts[3]);
            row.put("unchecked", 0L);
            rows.add(row);
        }

        String scope = deptCode != null ? departments.get(0).getDeptName() : "Toàn viện";
        String filename = String.format("bao-cao-lam-viec-%s-%s-%s.xlsx",
                slug(scope), from, to);

        Map<String, Object> result = new HashMap<>();
        result.put("title", "Báo cáo trạng thái làm việc");
        result.put("scopeLabel", scope);
        result.put("fromDate", from.toString());
        result.put("toDate", to.toString());
        result.put("fromDateFormatted", DMY.format(from));
        result.put("toDateFormatted", DMY.format(to));
        result.put("rows", rows);
        result.put("filename", filename);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> buildAttendanceStatusReport(AuthUser authUser, Map<String, Object> args) {
        LocalDate date = dateArg(args, "date", timeService.today());
        List<AttendanceSummaryDto> summaries = attendanceService.getAllSummaries(authUser, date);

        List<Map<String, Object>> rows = summaries.stream().map(s -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("deptCode", s.getDeptCode());
            row.put("deptCodeFormatted", s.getDeptCodeFormatted());
            row.put("deptName", s.getDeptName());
            row.put("diLam", s.getDiLam());
            row.put("nghiPhep", s.getNghiPhep());
            row.put("diHoc", s.getDiHoc());
            row.put("diCongTac", s.getDiCongTac());
            row.put("unchecked", s.getUncheckedCount());
            row.put("progressPercent", s.getProgressPercent());
            row.put("completionStatus", s.getCompletionStatus().name());
            row.put("completionLabel", s.getCompletionStatus() == CompletionStatus.COMPLETED
                    ? "HOÀN THÀNH" : "CHƯA XONG");
            return row;
        }).collect(Collectors.toList());

        String filename = String.format("bao-cao-cham-cong-ngay-%s.xlsx", date);

        Map<String, Object> result = new HashMap<>();
        result.put("title", "Báo cáo trạng thái chấm công");
        result.put("date", date.toString());
        result.put("dateFormatted", DMY.format(date));
        result.put("rows", rows);
        result.put("filename", filename);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listPendingDepartments(AuthUser authUser) {
        LocalDate today = timeService.today();
        List<AttendanceSummaryDto> incomplete = attendanceService.getAllSummaries(authUser, today).stream()
                .filter(s -> s.getCompletionStatus() == CompletionStatus.INCOMPLETE)
                .toList();

        List<Integer> deptCodes = incomplete.stream().map(AttendanceSummaryDto::getDeptCode).toList();
        String actionId = pendingActionStore.saveReminderAction(deptCodes);

        List<Map<String, Object>> departments = incomplete.stream().map(s -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("deptCode", s.getDeptCode());
            item.put("deptCodeFormatted", s.getDeptCodeFormatted());
            item.put("deptName", s.getDeptName());
            item.put("markedCount", s.getMarkedCount());
            item.put("total", s.getTotal());
            item.put("progressPercent", s.getProgressPercent());
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("date", today.toString());
        result.put("dateFormatted", DMY.format(today));
        result.put("departments", departments);
        result.put("actionId", actionId);
        result.put("showReminderCta", !departments.isEmpty());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> previewBatchReminders(AuthUser authUser) {
        LocalDate today = timeService.today();
        List<AttendanceSummaryDto> incomplete = attendanceService.getAllSummaries(authUser, today).stream()
                .filter(s -> s.getCompletionStatus() == CompletionStatus.INCOMPLETE)
                .toList();

        List<Integer> deptCodes = incomplete.stream().map(AttendanceSummaryDto::getDeptCode).toList();
        String actionId = pendingActionStore.saveReminderAction(deptCodes);

        List<AiReminderPreviewDeptDto> departments = incomplete.stream()
                .map(s -> AiReminderPreviewDeptDto.builder()
                        .deptCode(s.getDeptCode())
                        .deptCodeFormatted(s.getDeptCodeFormatted())
                        .deptName(s.getDeptName())
                        .markedCount(s.getMarkedCount())
                        .total(s.getTotal())
                        .progressPercent(s.getProgressPercent())
                        .build())
                .toList();

        return Map.of(
                "actionId", actionId,
                "departments", departments,
                "attendanceDate", today.toString()
        );
    }

    @Transactional
    public SendReminderResultDto confirmBatchReminders(AuthUser authUser, String actionId, List<Integer> deptCodes) {
        if (!pendingActionStore.consumeReminderAction(actionId, deptCodes).isPresent()) {
            throw new BusinessException("Phiên xác nhận đã hết hạn hoặc danh sách ĐƠN VỊ không hợp lệ");
        }
        return attendanceReminderService.sendManualReminders(authUser, deptCodes);
    }

    public Map<String, Object> executeTool(AuthUser authUser, String tool, Map<String, Object> params) {
        Map<String, Object> args = params != null ? params : Map.of();
        return switch (tool) {
            case "work_status_report" -> buildWorkStatusReport(authUser, args);
            case "attendance_status_report" -> buildAttendanceStatusReport(authUser, args);
            case "list_pending_departments" -> listPendingDepartments(authUser);
            case "batch_reminders" -> previewBatchReminders(authUser);
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

    private int intArg(Map<String, Object> args, String key, int defaultValue) {
        Object value = args.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String s && !s.isBlank()) {
            return Integer.parseInt(s);
        }
        return defaultValue;
    }

    private Integer intOrNull(Map<String, Object> args, String key) {
        Object value = args.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String s && !s.isBlank()) {
            return Integer.parseInt(s);
        }
        return null;
    }

    private String slug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\\s-]", "")
                .replaceAll("\\s+", "-");
    }
}
