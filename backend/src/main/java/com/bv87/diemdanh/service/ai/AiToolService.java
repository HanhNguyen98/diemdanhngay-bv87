package com.bv87.diemdanh.service.ai;

import com.bv87.diemdanh.dto.AttendanceSummaryDto;
import com.bv87.diemdanh.dto.MissingPunchItemDto;
import com.bv87.diemdanh.dto.MissingPunchesResponseDto;
import com.bv87.diemdanh.dto.SendReminderResultDto;
import com.bv87.diemdanh.dto.ai.AiReminderPreviewDeptDto;
import com.bv87.diemdanh.entity.CompletionStatus;
import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AttendanceRecordRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.AttendanceReminderService;
import com.bv87.diemdanh.service.AttendanceService;
import com.bv87.diemdanh.service.AttendanceStatusCatalogService;
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

/** Admin AI tools — SPEC_AI_ASSISTANT (missing-punch reminders after P5). */
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
    private final AttendanceStatusCatalogService statusCatalogService;

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
                        .filter(Department::isActive)
                        .orElseThrow(() -> new BusinessException("Không tìm thấy Đơn vị")))
                : departmentRepository.findAll().stream()
                        .filter(Department::isActive)
                        .toList();

        Map<Integer, Map<String, Long>> countsByDept = new HashMap<>();
        for (Object[] aggregate : attendanceRecordRepository.aggregateWorkStatusByDept(from, to, deptCode)) {
            Integer code = (Integer) aggregate[0];
            String status = aggregate[2].toString();
            long count = (Long) aggregate[3];
            countsByDept.computeIfAbsent(code, ignored -> new HashMap<>()).merge(status, count, Long::sum);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Department dept : departments) {
            Map<String, Long> deptCounts = countsByDept.getOrDefault(dept.getDeptCode(), Map.of());
            List<com.bv87.diemdanh.dto.StatusBreakdownItemDto> breakdown =
                    statusCatalogService.buildBreakdown(deptCounts);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("deptCode", dept.getDeptCode());
            row.put("deptCodeFormatted", CodeFormatter.formatDeptCode(dept.getDeptCode()));
            row.put("deptName", dept.getDeptName());
            row.put("statusBreakdown", breakdown);
            row.put("unchecked", 0L);
            rows.add(row);
        }

        List<com.bv87.diemdanh.dto.StatusBreakdownItemDto> statusColumns =
                statusCatalogService.buildBreakdown(countsByDept.values().stream()
                        .reduce(new HashMap<>(), (acc, map) -> {
                            map.forEach((k, v) -> acc.merge(k, v, Long::sum));
                            return acc;
                        }));

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
        result.put("statusColumns", statusColumns);
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
            row.put("statusBreakdown", s.getStatusBreakdown());
            row.put("unchecked", s.getUncheckedCount());
            row.put("progressPercent", s.getProgressPercent());
            row.put("completionStatus", s.getCompletionStatus().name());
            row.put("completionLabel", s.getCompletionStatus() == CompletionStatus.COMPLETED
                    ? "ĐỦ TRẠNG THÁI" : "THIẾU TRẠNG THÁI");
            return row;
        }).collect(Collectors.toList());

        List<com.bv87.diemdanh.dto.StatusBreakdownItemDto> statusColumns = statusCatalogService.mergeBreakdowns(
                summaries.stream().map(AttendanceSummaryDto::getStatusBreakdown).toList());

        String filename = String.format("bao-cao-cham-cong-ngay-%s.xlsx", date);

        Map<String, Object> result = new HashMap<>();
        result.put("title", "Báo cáo trạng thái Chấm công");
        result.put("date", date.toString());
        result.put("dateFormatted", DMY.format(date));
        result.put("rows", rows);
        result.put("statusColumns", statusColumns);
        result.put("filename", filename);
        return result;
    }

    /**
     * Departments that still have missing punches on the target date (default yesterday).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listMissingPunchDepartments(AuthUser authUser, Map<String, Object> args) {
        LocalDate targetDate = resolveMissingPunchDate(args);
        MissingPunchesResponseDto missing =
                attendanceService.listMissingPunches(authUser, null, targetDate);
        List<Map<String, Object>> departments = aggregateMissingByDept(missing.getItems());

        List<Integer> deptCodes = departments.stream()
                .map(d -> (Integer) d.get("deptCode"))
                .toList();
        String actionId = pendingActionStore.saveReminderAction(deptCodes, targetDate);

        Map<String, Object> result = new HashMap<>();
        result.put("date", targetDate.toString());
        result.put("dateFormatted", DMY.format(targetDate));
        result.put("departments", departments);
        result.put("actionId", actionId);
        result.put("showReminderCta", !departments.isEmpty());
        return result;
    }

    /** Preview reminder confirm card for missing-punch departments. */
    @Transactional(readOnly = true)
    public Map<String, Object> previewMissingPunchReminders(AuthUser authUser, Map<String, Object> args) {
        LocalDate targetDate = resolveMissingPunchDate(args);
        MissingPunchesResponseDto missing =
                attendanceService.listMissingPunches(authUser, null, targetDate);
        List<Map<String, Object>> aggregated = aggregateMissingByDept(missing.getItems());

        List<Integer> deptCodes = aggregated.stream()
                .map(d -> (Integer) d.get("deptCode"))
                .toList();
        String actionId = pendingActionStore.saveReminderAction(deptCodes, targetDate);

        List<AiReminderPreviewDeptDto> departments = aggregated.stream()
                .map(d -> AiReminderPreviewDeptDto.builder()
                        .deptCode((Integer) d.get("deptCode"))
                        .deptCodeFormatted((String) d.get("deptCodeFormatted"))
                        .deptName((String) d.get("deptName"))
                        .missingCount(((Number) d.get("missingCount")).longValue())
                        .missingCheckoutCount(((Number) d.get("missingCheckoutCount")).longValue())
                        .unmarkedCount(((Number) d.get("unmarkedCount")).longValue())
                        .build())
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("actionId", actionId);
        result.put("departments", departments);
        result.put("attendanceDate", targetDate.toString());
        result.put("dateFormatted", DMY.format(targetDate));
        return result;
    }

    /** @deprecated Alias — use {@link #listMissingPunchDepartments}. */
    @Transactional(readOnly = true)
    public Map<String, Object> listPendingDepartments(AuthUser authUser) {
        return listMissingPunchDepartments(authUser, Map.of());
    }

    /** @deprecated Alias — use {@link #previewMissingPunchReminders}. */
    @Transactional(readOnly = true)
    public Map<String, Object> previewBatchReminders(AuthUser authUser) {
        return previewMissingPunchReminders(authUser, Map.of());
    }

    @Transactional
    public SendReminderResultDto confirmBatchReminders(AuthUser authUser, String actionId, List<Integer> deptCodes) {
        var action = pendingActionStore.consumeReminderAction(actionId, deptCodes)
                .orElseThrow(() -> new BusinessException(
                        "Phiên xác nhận đã hết hạn hoặc danh sách ĐƠN VỊ không hợp lệ"));
        return attendanceReminderService.sendManualReminders(
                authUser, deptCodes, action.attendanceDate());
    }

    public Map<String, Object> executeTool(AuthUser authUser, String tool, Map<String, Object> params) {
        Map<String, Object> args = params != null ? params : Map.of();
        return switch (tool) {
            case "work_status_report" -> buildWorkStatusReport(authUser, args);
            case "attendance_status_report" -> buildAttendanceStatusReport(authUser, args);
            case "list_missing_punches", "list_pending_departments" -> listMissingPunchDepartments(authUser, args);
            case "remind_missing_punch_depts", "batch_reminders" -> previewMissingPunchReminders(authUser, args);
            default -> throw new BusinessException("Tool không được hỗ trợ: " + tool);
        };
    }

    private LocalDate resolveMissingPunchDate(Map<String, Object> args) {
        return dateArg(args, "date", timeService.today().minusDays(1));
    }

    private List<Map<String, Object>> aggregateMissingByDept(List<MissingPunchItemDto> items) {
        Map<Integer, List<MissingPunchItemDto>> byDept = items.stream()
                .collect(Collectors.groupingBy(
                        MissingPunchItemDto::getDeptCode,
                        LinkedHashMap::new,
                        Collectors.toList()));

        List<Map<String, Object>> departments = new ArrayList<>();
        for (Map.Entry<Integer, List<MissingPunchItemDto>> entry : byDept.entrySet()) {
            List<MissingPunchItemDto> group = entry.getValue();
            MissingPunchItemDto first = group.get(0);
            long checkout = group.stream().filter(i -> "MISSING_CHECK_OUT".equals(i.getReason())).count();
            long unmarked = group.stream().filter(i -> "UNMARKED".equals(i.getReason())).count();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("deptCode", first.getDeptCode());
            item.put("deptCodeFormatted", first.getDeptCodeFormatted());
            item.put("deptName", first.getDeptName());
            item.put("missingCount", (long) group.size());
            item.put("missingCheckoutCount", checkout);
            item.put("unmarkedCount", unmarked);
            departments.add(item);
        }
        return departments;
    }

    private LocalDate dateArg(Map<String, Object> args, String key, LocalDate defaultValue) {
        Object value = args.get(key);
        if (value == null) {
            return defaultValue;
        }
        return LocalDate.parse(value.toString());
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
