package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.entity.*;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.*;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.ai.AiPendingActionStore;
import com.bv87.diemdanh.util.CodeFormatter;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm:ss");

    private final AttendanceRecordRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final AttendanceUnlockRepository unlockRepository;
    private final AttendanceManualLockRepository manualLockRepository;
    private final AttendanceReportSubmissionRepository reportSubmissionRepository;
    private final AttendanceReportBlockRepository reportBlockRepository;
    private final AttendanceLockService lockService;
    private final VietnamTimeService timeService;
    private final AiPendingActionStore pendingActionStore;
    private final AttendanceStatusCatalogService statusCatalogService;
    private final AccountRepository accountRepository;

    public List<DepartmentDto> getAllDepartments(AuthUser authUser) {
        LocalDate today = timeService.today();
        AccountRole role = authUser.getAccount().getRole();
        return departmentRepository.findAll().stream()
                .filter(Department::isActive)
                .sorted(Comparator.comparing(Department::getDeptCode))
                .map(dept -> {
                    boolean locked = lockService.isDepartmentLocked(dept.getDeptCode(), today);
                    boolean unlocked = lockService.isUnlocked(dept.getDeptCode(), today);
                    boolean editable = lockService.isEditable(dept.getDeptCode(), role, today);
                    return DepartmentDto.from(dept, locked, unlocked, editable);
                })
                .toList();
    }

    public SessionStatusDto getSessionStatus(AuthUser authUser) {
        Integer deptCode = authUser.getDeptCode();
        AccountRole role = authUser.getAccount().getRole();
        LocalDate today = timeService.today();
        boolean locked = deptCode != null && lockService.isDepartmentLocked(deptCode, today);
        boolean unlocked = deptCode != null && lockService.isUnlocked(deptCode, today);
        boolean editable = deptCode != null && lockService.isEditable(deptCode, role, today);

        String message = lockService.getLockMessage(deptCode, role, today);
        if (message == null && editable) {
            message = "Đang trong khung giờ điểm danh ("
                    + timeService.formatOpenTime() + " - " + timeService.formatLockTime() + ")";
        }
        if (role == AccountRole.ADMIN) {
            message = "Quản trị viên - Toàn quyền truy cập";
        }

        return SessionStatusDto.builder()
                .editable(editable)
                .locked(locked)
                .beforeOpen(timeService.isBeforeOpenWindow())
                .afterLock(timeService.isAfterLockTime())
                .unlocked(unlocked)
                .openTime(timeService.getOpenTime())
                .lockTime(timeService.getLockTime())
                .currentTimeVn(timeService.currentTime().format(TIME_FMT))
                .message(message)
                .build();
    }

    public AttendanceSummaryDto getSummary(AuthUser authUser, Integer departmentCode, LocalDate date) {
        Integer deptCode = resolveDeptCode(authUser, departmentCode);
        lockService.assertCanView(authUser, deptCode);

        Department dept = departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));

        List<Employee> employees = staffForAttendance(employeeRepository.findByDeptCode(deptCode));
        Map<Integer, AttendanceRecord> recordMap = attendanceRepository
                .findByDateAndDeptCode(date, deptCode).stream()
                .collect(Collectors.toMap(AttendanceRecord::getEmpCode, r -> r));

        Map<String, Long> counts = tallyRecords(recordMap.values());
        List<StatusBreakdownItemDto> breakdown = statusCatalogService.buildBreakdown(counts);

        return buildSummary(dept, date, employees.size(), breakdown, authUser.getAccount().getRole(),
                hasActiveHeadAccount(dept.getDeptCode()));
    }

    public List<AttendanceSummaryDto> getAllSummariesForSystem(LocalDate date) {
        return buildAllSummaries(date, AccountRole.ADMIN);
    }

    public List<AttendanceSummaryDto> getAllSummaries(AuthUser authUser, LocalDate date) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới xem tổng hợp toàn viện");
        }
        return buildAllSummaries(date, authUser.getAccount().getRole());
    }

    private List<AttendanceSummaryDto> buildAllSummaries(LocalDate date, AccountRole role) {
        List<Department> departments = departmentRepository.findAll().stream()
                .filter(Department::isActive)
                .sorted(Comparator.comparing(Department::getDeptCode))
                .toList();
        Map<Integer, Long> totalsByDept = loadActiveEmployeeCountsByDept();
        Map<Integer, Map<String, Long>> countsByDept = loadStatusCountsByDeptForDate(date);
        Set<Integer> headDeptCodes = loadDeptCodesWithActiveHeadAccount();

        return departments.stream()
                .map(dept -> {
                    Integer deptCode = dept.getDeptCode();
                    Map<String, Long> counts = countsByDept.getOrDefault(deptCode, Map.of());
                    List<StatusBreakdownItemDto> breakdown = statusCatalogService.buildBreakdown(counts);
                    int total = totalsByDept.getOrDefault(deptCode, 0L).intValue();
                    return buildSummary(dept, date, total, breakdown, role, headDeptCodes.contains(deptCode));
                })
                .toList();
    }

    private Set<Integer> loadDeptCodesWithActiveHeadAccount() {
        return accountRepository.findAllActiveByRole(AccountRole.HEAD).stream()
                .map(Account::getDeptCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private boolean hasActiveHeadAccount(Integer deptCode) {
        return accountRepository.existsActiveByRoleAndDeptCode(AccountRole.HEAD, deptCode);
    }

    private Map<Integer, Long> loadActiveEmployeeCountsByDept() {
        Map<Integer, Long> map = new HashMap<>();
        for (Object[] row : employeeRepository.countActiveByDeptCode()) {
            map.put((Integer) row[0], (Long) row[1]);
        }
        return map;
    }

    private Map<Integer, Map<String, Long>> loadStatusCountsByDeptForDate(LocalDate date) {
        Map<Integer, Map<String, Long>> map = new HashMap<>();
        for (AttendanceRecord record : attendanceRepository.findByDate(date)) {
            Integer deptCode = record.getEmployee().getDepartment().getDeptCode();
            map.computeIfAbsent(deptCode, ignored -> new HashMap<>())
                    .merge(record.getStatus(), 1L, Long::sum);
        }
        return map;
    }

    @Transactional
    public Map<String, Object> previewBatchAttendance(
            AuthUser authUser, LocalDate date, String status, String scope) {
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Chỉ Trưởng đơn vị mới Điểm danh hàng loạt qua AI");
        }
        Integer deptCode = authUser.getDeptCode();
        if (deptCode == null) {
            throw new BusinessException("Tài khoản chưa gắn mã Đơn vị");
        }
        lockService.assertCanWrite(authUser, deptCode, date);
        statusCatalogService.assertActiveStatus(status);

        List<Employee> employees = staffForAttendance(employeeRepository.findByDeptCode(deptCode));
        Map<Integer, AttendanceRecord> recordMap = attendanceRepository
                .findByDateAndDeptCode(date, deptCode).stream()
                .collect(Collectors.toMap(AttendanceRecord::getEmpCode, r -> r));

        boolean allStaff = "all_staff".equals(scope);
        List<Map<String, Object>> targets = new ArrayList<>();
        int overwriteCount = 0;

        for (Employee emp : employees) {
            AttendanceRecord record = recordMap.get(emp.getEmpCode());
            boolean unchecked = record == null;
            if (!allStaff && !unchecked) {
                continue;
            }
            if (allStaff && record != null && !status.equals(record.getStatus())) {
                overwriteCount++;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("empCode", emp.getEmpCode());
            item.put("empCodeFormatted", CodeFormatter.formatEmpCode(emp.getEmpCode()));
            item.put("fullname", emp.getFullname());
            item.put("currentStatus", record != null ? record.getStatus() : null);
            item.put("currentStatusLabel", record != null
                    ? statusCatalogService.resolveLabel(record.getStatus()) : "CHƯA CHẤM");
            targets.add(item);
        }

        List<Integer> empCodes = targets.stream().map(t -> (Integer) t.get("empCode")).toList();
        String actionId = pendingActionStore.saveBatchAttendanceAction(
                deptCode, date, status, scope, empCodes);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("actionId", actionId);
        result.put("date", date.toString());
        result.put("status", status);
        result.put("statusLabel", statusCatalogService.resolveLabel(status));
        result.put("scope", scope);
        result.put("scopeLabel", allStaff ? "Toàn bộ nhân viên" : "Chỉ nhân viên CHƯA CHẤM");
        result.put("targetCount", targets.size());
        result.put("overwriteCount", overwriteCount);
        result.put("staff", targets);
        return result;
    }

    @Transactional
    public Map<String, Object> confirmBatchAttendance(AuthUser authUser, String actionId) {
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Chỉ Trưởng đơn vị mới Điểm danh hàng loạt qua AI");
        }
        Integer deptCode = authUser.getDeptCode();
        var action = pendingActionStore.consumeBatchAttendanceAction(actionId, deptCode)
                .orElseThrow(() -> new BusinessException("Phiên xác nhận đã hết hạn hoặc không hợp lệ"));

        lockService.assertCanWrite(authUser, deptCode, action.date());
        int updated = 0;
        for (Integer empCode : action.empCodes()) {
            UpdateAttendanceRequest request = new UpdateAttendanceRequest();
            request.setEmpCode(empCode);
            request.setStatus(action.status());
            saveAttendance(authUser, request, action.date());
            updated++;
        }

        return Map.of(
                "updated", updated,
                "date", action.date().toString(),
                "status", action.status(),
                "statusLabel", statusCatalogService.resolveLabel(action.status()),
                "message", String.format("Đã Điểm danh %s cho %d nhân viên.",
                        statusCatalogService.resolveLabel(action.status()), updated));
    }

    public List<StaffAttendanceDto> getStaffList(AuthUser authUser, Integer departmentCode, LocalDate date) {
        Integer deptCode = resolveDeptCode(authUser, departmentCode);
        lockService.assertCanView(authUser, deptCode);

        List<Employee> employees = staffForAttendance(employeeRepository.findByDeptCode(deptCode));
        Map<Integer, AttendanceRecord> recordMap = attendanceRepository
                .findByDateAndDeptCode(date, deptCode).stream()
                .collect(Collectors.toMap(AttendanceRecord::getEmpCode, r -> r));

        return employees.stream()
                .map(emp -> toStaffDto(emp, deptCode, recordMap.get(emp.getEmpCode())))
                .toList();
    }

    /** Gộp summary + staff — một round-trip, dùng chung snapshot DB. */
    public AttendancePageDto getAttendancePage(AuthUser authUser, Integer departmentCode, LocalDate date) {
        Integer deptCode = resolveDeptCode(authUser, departmentCode);
        lockService.assertCanView(authUser, deptCode);

        Department dept = departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));

        List<Employee> employees = staffForAttendance(employeeRepository.findByDeptCode(deptCode));
        Map<Integer, AttendanceRecord> recordMap = attendanceRepository
                .findByDateAndDeptCode(date, deptCode).stream()
                .collect(Collectors.toMap(AttendanceRecord::getEmpCode, r -> r));

        Map<String, Long> counts = tallyRecords(recordMap.values());
        List<StatusBreakdownItemDto> breakdown = statusCatalogService.buildBreakdown(counts);

        AttendanceSummaryDto summary = buildSummary(
                dept, date, employees.size(), breakdown, authUser.getAccount().getRole(),
                hasActiveHeadAccount(deptCode));

        List<StaffAttendanceDto> staff = employees.stream()
                .map(emp -> toStaffDto(emp, deptCode, recordMap.get(emp.getEmpCode())))
                .toList();

        return AttendancePageDto.builder().summary(summary).staff(staff).build();
    }

    @Transactional
    public StaffAttendanceDto saveAttendance(AuthUser authUser, UpdateAttendanceRequest request, LocalDate date) {
        Employee employee = employeeRepository.findByEmpCodeWithDept(request.getEmpCode())
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy nhân viên mã " + CodeFormatter.formatEmpCode(request.getEmpCode())));

        Integer deptCode = employee.getDepartment().getDeptCode();
        lockService.assertCanWrite(authUser, deptCode, date);
        statusCatalogService.assertActiveStatus(request.getStatus());

        AttendanceRecord record = attendanceRepository
                .findByDateAndEmpCode(date, request.getEmpCode())
                .orElseGet(() -> {
                    AttendanceRecord r = new AttendanceRecord();
                    r.setAttendanceDate(date);
                    r.setEmployee(employee);
                    return r;
                });

        record.setStatus(request.getStatus());
        record.setNote(request.getNote());
        AttendanceRecord saved = attendanceRepository.save(record);

        return StaffAttendanceDto.builder()
                .recordId(saved.getId())
                .empCode(employee.getEmpCode())
                .empCodeFormatted(CodeFormatter.formatEmpCode(employee.getEmpCode()))
                .fullname(employee.getFullname())
                .deptCode(deptCode)
                .deptCodeFormatted(CodeFormatter.formatDeptCode(deptCode))
                .rankName(employee.getRankName())
                .positionName(employee.getPositionName())
                .avatarUrl(employee.getAvatarUrl())
                .status(saved.getStatus())
                .statusLabel(statusCatalogService.resolveLabel(saved.getStatus()))
                .note(saved.getNote())
                .build();
    }

    @Transactional
    public void unlockDepartment(AuthUser authUser, UnlockDepartmentRequest request) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được cấp quyền mở khóa");
        }

        Department dept = departmentRepository.findById(request.getDeptCode())
                .orElseThrow(() -> new BusinessException(
                        "Đơn vị không tồn tại: " + CodeFormatter.formatDeptCode(request.getDeptCode())));

        LocalDate today = timeService.today();
        if (unlockRepository.existsByDeptCodeAndDate(request.getDeptCode(), today)) {
            throw new BusinessException(
                    "Đơn vị " + CodeFormatter.formatDeptCode(request.getDeptCode())
                            + " đã được mở khóa hôm nay");
        }

        AttendanceUnlock unlock = new AttendanceUnlock();
        unlock.setDepartment(dept);
        unlock.setAttendanceDate(today);
        unlock.setReason(request.getReason().trim());
        unlockRepository.save(unlock);
    }

    /**
     * Revokes an admin unlock for today so the department returns to locked state after cutoff.
     */
    @Transactional
    public void relockDepartment(AuthUser authUser, Integer deptCode) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được khóa sổ lại");
        }

        departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException(
                        "Đơn vị không tồn tại: " + CodeFormatter.formatDeptCode(deptCode)));

        LocalDate today = timeService.today();
        AttendanceUnlock unlock = unlockRepository.findByDeptCodeAndDate(deptCode, today)
                .orElseThrow(() -> new BusinessException(
                        "Đơn vị " + CodeFormatter.formatDeptCode(deptCode)
                                + " chưa được mở khóa hôm nay"));

        unlockRepository.delete(unlock);
    }

    private static final String DASHBOARD_MANUAL_LOCK_REASON = "Khóa sổ từ bảng điều khiển";
    private static final String DASHBOARD_UNLOCK_REASON = "Mở khóa từ bảng điều khiển";

    /**
     * Toggles lock state for a department on today's attendance date.
     *
     * @return result with new lock flags and a Vietnamese user message
     */
    @Transactional
    public ToggleDeptLockResultDto toggleDepartmentLock(AuthUser authUser, Integer deptCode) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được thao tác khóa sổ");
        }

        Department dept = departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException(
                        "Đơn vị không tồn tại: " + CodeFormatter.formatDeptCode(deptCode)));

        LocalDate today = timeService.today();
        String deptLabel = dept.getDeptName();

        if (manualLockRepository.existsByDeptCodeAndDate(deptCode, today)) {
            manualLockRepository.findByDeptCodeAndDate(deptCode, today)
                    .ifPresent(manualLockRepository::delete);
            return buildToggleResult(deptCode, today, "Đã mở khóa — " + deptLabel);
        }

        if (unlockRepository.existsByDeptCodeAndDate(deptCode, today)) {
            unlockRepository.findByDeptCodeAndDate(deptCode, today)
                    .ifPresent(unlockRepository::delete);
            return buildToggleResult(deptCode, today, "Đã khóa sổ — " + deptLabel);
        }

        if (timeService.isAfterLockTime()) {
            AttendanceUnlock unlock = new AttendanceUnlock();
            unlock.setDepartment(dept);
            unlock.setAttendanceDate(today);
            unlock.setReason(DASHBOARD_UNLOCK_REASON);
            unlockRepository.save(unlock);
            return buildToggleResult(deptCode, today, "Đã mở khóa — " + deptLabel);
        }

        AttendanceManualLock manualLock = new AttendanceManualLock();
        manualLock.setDepartment(dept);
        manualLock.setAttendanceDate(today);
        manualLock.setReason(DASHBOARD_MANUAL_LOCK_REASON);
        manualLock.setLockedBy(authUser.getAccount().getId());
        manualLockRepository.save(manualLock);
        return buildToggleResult(deptCode, today, "Đã khóa sổ — " + deptLabel);
    }

    private ToggleDeptLockResultDto buildToggleResult(Integer deptCode, LocalDate date, String message) {
        boolean manualLocked = lockService.isManualLocked(deptCode, date);
        boolean unlocked = lockService.isUnlocked(deptCode, date);
        boolean locked = lockService.isDepartmentLocked(deptCode, date);
        return ToggleDeptLockResultDto.builder()
                .locked(locked)
                .manualLocked(manualLocked)
                .unlocked(unlocked)
                .message(message)
                .build();
    }

    @Transactional
    public void submitReport(AuthUser authUser, Integer deptCode, LocalDate date) {
        Integer targetDept = resolveDeptCode(authUser, deptCode);
        if (!authUser.isAdmin() && !targetDept.equals(authUser.getDeptCode())) {
            throw new AccessDeniedException("Không có quyền gửi báo cáo cho ĐƠN VỊ này");
        }
        if (reportBlockRepository.findByAttendanceDateAndDeptCode(date, targetDept).isPresent()) {
            throw new BusinessException("Admin đã khóa gửi báo cáo cho ĐƠN VỊ này trong ngày hôm nay.");
        }
        AttendanceSummaryDto summary = getSummary(authUser, targetDept, date);
        if (summary.getCompletionStatus() != CompletionStatus.COMPLETED) {
            throw new BusinessException("Chưa chấm đủ nhân sự. Vui lòng hoàn thành điểm danh trước khi gửi báo cáo.");
        }
        if (reportSubmissionRepository.findByAttendanceDateAndDeptCode(date, targetDept).isPresent()) {
            throw new BusinessException("Đã gửi báo cáo cho ngày này.");
        }
        AttendanceReportSubmission submission = new AttendanceReportSubmission();
        submission.setAttendanceDate(date);
        submission.setDeptCode(targetDept);
        submission.setSubmittedBy(authUser.getAccount().getId());
        reportSubmissionRepository.save(submission);
    }

    private Integer resolveDeptCode(AuthUser authUser, Integer requestedCode) {
        if (authUser.isAdmin()) {
            if (requestedCode == null) {
                throw new BusinessException("Admin cần chọn mã Đơn vị");
            }
            return requestedCode;
        }
        return authUser.getDeptCode();
    }

    private AttendanceSummaryDto buildSummary(
            Department dept,
            LocalDate date,
            int total,
            List<StatusBreakdownItemDto> statusBreakdown,
            AccountRole role,
            boolean hasActiveHeadAccount) {
        Integer deptCode = dept.getDeptCode();
        boolean locked = lockService.isDepartmentLocked(deptCode, date);
        boolean unlocked = lockService.isUnlocked(deptCode, date);
        boolean manualLocked = lockService.isManualLocked(deptCode, date);
        boolean editable = lockService.isEditable(deptCode, role, date);
        long markedCount = statusCatalogService.sumBreakdownCounts(statusBreakdown);
        long uncheckedCount = Math.max(0, total - markedCount);
        int progressPercent = total == 0 ? 0 : (int) Math.round(100.0 * markedCount / total);
        CompletionStatus completionStatus =
                total > 0 && markedCount >= total ? CompletionStatus.COMPLETED : CompletionStatus.INCOMPLETE;
        boolean reportSubmitted =
                reportSubmissionRepository.findByAttendanceDateAndDeptCode(date, deptCode).isPresent();
        boolean reportBlocked =
                reportBlockRepository.findByAttendanceDateAndDeptCode(date, deptCode).isPresent();

        return AttendanceSummaryDto.builder()
                .attendanceDate(date)
                .deptCode(deptCode)
                .deptCodeFormatted(CodeFormatter.formatDeptCode(deptCode))
                .deptName(dept.getDeptName())
                .deptNameDisplay(resolveDeptNameDisplay(dept.getDeptName(), dept.getUnitCode()))
                .unitCode(dept.getUnitCode())
                .total(total)
                .statusBreakdown(statusBreakdown)
                .locked(locked)
                .unlocked(unlocked)
                .editable(editable)
                .lockTime(timeService.formatLockTime())
                .lockMessage(locked ? lockService.getLockMessage(deptCode, role, date) : null)
                .markedCount(markedCount)
                .uncheckedCount(uncheckedCount)
                .progressPercent(progressPercent)
                .completionStatus(completionStatus)
                .reportSubmitted(reportSubmitted)
                .reportBlocked(reportBlocked)
                .manualLocked(manualLocked)
                .hasActiveHeadAccount(hasActiveHeadAccount)
                .build();
    }

    private String resolveDeptNameDisplay(String deptName, String unitCode) {
        if (deptName == null) return null;
        String name = deptName.trim();
        if (unitCode == null || unitCode.isBlank()) return name;
        String uc = unitCode.trim();
        // Remove trailing "(<unitCode>)" with optional spaces, only when it matches the configured unitCode.
        String regex = "\\s*\\(\\s*" + java.util.regex.Pattern.quote(uc) + "\\s*\\)\\s*$";
        return name.replaceAll(regex, "").trim();
    }

    private Map<String, Long> tallyRecords(Collection<AttendanceRecord> records) {
        return statusCatalogService.tallyStatusCodes(
                records.stream().map(AttendanceRecord::getStatus).toList());
    }

    /** Nhân viên đang hoạt động của phòng — gồm cả trưởng phòng; không lọc theo chức vụ. */
    private List<Employee> staffForAttendance(List<Employee> employees) {
        return employees.stream()
                .filter(Employee::isActive)
                .toList();
    }

    private StaffAttendanceDto toStaffDto(Employee emp, Integer deptCode, AttendanceRecord record) {
        String status = record != null ? record.getStatus() : null;
        return StaffAttendanceDto.builder()
                .recordId(record != null ? record.getId() : null)
                .empCode(emp.getEmpCode())
                .empCodeFormatted(CodeFormatter.formatEmpCode(emp.getEmpCode()))
                .fullname(emp.getFullname())
                .deptCode(deptCode)
                .deptCodeFormatted(CodeFormatter.formatDeptCode(deptCode))
                .rankName(emp.getRankName())
                .positionName(emp.getPositionName())
                .avatarUrl(emp.getAvatarUrl())
                .status(status)
                .statusLabel(status != null ? statusCatalogService.resolveLabel(status) : null)
                .note(record != null ? record.getNote() : null)
                .build();
    }
}
