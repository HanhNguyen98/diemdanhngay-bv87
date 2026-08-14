package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.entity.*;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.*;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.ai.AiPendingActionStore;
import com.bv87.diemdanh.util.AttendanceValidity;
import com.bv87.diemdanh.util.CodeFormatter;
import com.bv87.diemdanh.util.VietnamTimeService;
import com.bv87.diemdanh.util.WorkSchedule;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
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
    private final FingerprintScanLogRepository scanLogRepository;
    private final WorkScheduleService workScheduleService;

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
            message = "Đang trong khung giờ Chấm công ("
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
            if (!AttendanceValidity.isComplete(record)) {
                continue;
            }
            String status = record.getStatus();
            Integer deptCode = record.getEmployee().getDepartment().getDeptCode();
            map.computeIfAbsent(deptCode, ignored -> new HashMap<>())
                    .merge(status, 1L, Long::sum);
        }
        return map;
    }

    @Transactional
    public Map<String, Object> previewBatchAttendance(
            AuthUser authUser, LocalDate date, String status, String scope) {
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Chỉ Trưởng đơn vị mới Chấm công hàng loạt qua AI");
        }
        Integer deptCode = authUser.getDeptCode();
        if (deptCode == null) {
            throw new BusinessException("Tài khoản chưa gắn mã Đơn vị");
        }
        lockService.assertCanWrite(authUser, deptCode, date);
        assertHeadManualStatus(status);
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
            if (record != null && AttendanceValidity.isPresenceStatus(record.getStatus())) {
                continue;
            }
            boolean unchecked = !AttendanceValidity.isComplete(record);
            if (!allStaff && !unchecked) {
                continue;
            }
            if (allStaff && record != null && record.getStatus() != null && !status.equals(record.getStatus())) {
                overwriteCount++;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("empCode", emp.getEmpCode());
            item.put("empCodeFormatted", CodeFormatter.formatEmpCode(emp.getEmpCode()));
            item.put("fullname", emp.getFullname());
            item.put("currentStatus", record != null ? record.getStatus() : null);
            item.put("currentStatusLabel",
                    record != null && record.getStatus() != null
                            ? statusCatalogService.resolveLabel(record.getStatus())
                            : "CHƯA CHẤM");
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
            throw new AccessDeniedException("Chỉ Trưởng đơn vị mới Chấm công hàng loạt qua AI");
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
                "message", String.format("Đã Chấm công %s cho %d nhân viên.",
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
        if (authUser.isHead()) {
            assertHeadManualStatus(request.getStatus());
        }

        AttendanceRecord record = attendanceRepository
                .findByDateAndEmpCode(date, request.getEmpCode())
                .orElseGet(() -> {
                    AttendanceRecord r = new AttendanceRecord();
                    r.setAttendanceDate(date);
                    r.setEmployee(employee);
                    return r;
                });

        if (authUser.isHead() && AttendanceValidity.isPresenceStatus(record.getStatus())
                && !isPostScanOverride(request.getStatus())) {
            throw new BusinessException(
                    "Nhân viên đã Chấm công bằng vân tay. Không được gán trạng thái khác.");
        }

        // SPEC §4.8.1 — HEAD manual / AI batch: same semantics as manual-range
        if (authUser.isHead() || AttendanceValidity.isManualStatus(request.getStatus())) {
            applyManualStatus(authUser, record, request.getStatus(), request.getNote());
        } else {
            record.setStatus(request.getStatus());
            record.setNote(request.getNote());
        }
        AttendanceRecord saved = attendanceRepository.save(record);
        return toStaffDto(employee, deptCode, saved);
    }

    /**
     * Preview skip/assign counts for a manual date range (SPEC §3.2.1).
     */
    @Transactional(readOnly = true)
    public ManualAttendanceRangePreviewDto previewManualAttendanceRange(
            AuthUser authUser, ManualAttendanceRangePreviewRequest request) {
        LocalDate from = request.getFromDate();
        LocalDate to = request.getToDate();
        validateManualRangeDates(from, to);

        Employee employee = employeeRepository.findByEmpCodeWithDept(request.getEmpCode())
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy nhân viên mã " + CodeFormatter.formatEmpCode(request.getEmpCode())));
        Integer deptCode = employee.getDepartment().getDeptCode();
        lockService.assertCanAssignManual(authUser, deptCode);

        RangeSkipCounts counts = countManualRangeSkips(
                authUser, employee.getEmpCode(), deptCode, from, to, request.getStatus());
        int totalDays = (int) (ChronoUnit.DAYS.between(from, to) + 1);
        boolean requiresConfirm = !authUser.isAdmin() && counts.skippedFingerprint > 0;

        String message = null;
        if (requiresConfirm) {
            message = "Có " + counts.skippedFingerprint
                    + " ngày đã chấm bằng vân tay — sẽ được bỏ qua (không ghi đè). Tiếp tục?";
        }

        return ManualAttendanceRangePreviewDto.builder()
                .totalDays(totalDays)
                .assignableCount(counts.assignable)
                .skippedFingerprint(counts.skippedFingerprint)
                .skippedReportSubmitted(counts.skippedReport)
                .requiresFingerprintSkipConfirm(requiresConfirm)
                .message(message)
                .build();
    }

    /**
     * Assigns a manual leave status across fromDate..toDate (SPEC §3.2.1).
     *
     * @param authUser HEAD or ADMIN
     * @param request  emp, status, range
     * @return update/skip counts + Vietnamese message
     */
    @Transactional
    public ManualAttendanceRangeResultDto saveManualAttendanceRange(
            AuthUser authUser, ManualAttendanceRangeRequest request) {
        LocalDate from = request.getFromDate();
        LocalDate to = request.getToDate();
        validateManualRangeDates(from, to);

        Employee employee = employeeRepository.findByEmpCodeWithDept(request.getEmpCode())
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy nhân viên mã " + CodeFormatter.formatEmpCode(request.getEmpCode())));
        Integer deptCode = employee.getDepartment().getDeptCode();
        lockService.assertCanAssignManual(authUser, deptCode);
        statusCatalogService.assertActiveStatus(request.getStatus());
        assertHeadManualStatus(request.getStatus());
        if (AttendanceValidity.VE_SOM.equals(request.getStatus())) {
            throw new BusinessException("Về sớm chỉ nhập lý do cho đúng một ngày, không gán theo khoảng.");
        }

        Map<LocalDate, AttendanceRecord> existingByDate = attendanceRepository
                .findByEmpCodeAndDateBetween(employee.getEmpCode(), from, to).stream()
                .collect(Collectors.toMap(AttendanceRecord::getAttendanceDate, r -> r, (a, b) -> a));

        int updated = 0;
        int skippedFingerprint = 0;
        int skippedReport = 0;

        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            AttendanceRecord record = existingByDate.get(day);

            if (record != null && AttendanceValidity.isPresenceStatus(record.getStatus())
                    && !isPostScanOverride(request.getStatus())) {
                if (!authUser.isAdmin()) {
                    skippedFingerprint++;
                    continue;
                }
            }

            if (record == null) {
                record = new AttendanceRecord();
                record.setAttendanceDate(day);
                record.setEmployee(employee);
            }
            applyManualStatus(authUser, record, request.getStatus(), request.getNote());
            attendanceRepository.save(record);
            updated++;
        }

        if (updated == 0) {
            throw new BusinessException(
                    "Không cập nhật được ngày nào trong khoảng (đã quét vân tay hoặc đã gửi báo cáo).");
        }

        String statusLabel = statusCatalogService.resolveLabel(request.getStatus());
        StringBuilder msg = new StringBuilder();
        msg.append("Đã gán ").append(statusLabel).append(" cho ").append(updated).append(" ngày");
        if (skippedFingerprint > 0 || skippedReport > 0) {
            msg.append(" (");
            boolean first = true;
            if (skippedFingerprint > 0) {
                msg.append("bỏ qua ").append(skippedFingerprint).append(" ngày đã quét vân tay");
                first = false;
            }
            if (skippedReport > 0) {
                if (!first) {
                    msg.append("; ");
                }
                msg.append("bỏ qua ").append(skippedReport).append(" ngày đã gửi báo cáo");
            }
            msg.append(")");
        }
        msg.append(".");

        return ManualAttendanceRangeResultDto.builder()
                .updatedCount(updated)
                .skippedFingerprint(skippedFingerprint)
                .skippedReportSubmitted(skippedReport)
                .status(request.getStatus())
                .statusLabel(statusLabel)
                .message(msg.toString())
                .build();
    }

    private void validateManualRangeDates(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new BusinessException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }
        long dayCount = ChronoUnit.DAYS.between(from, to) + 1;
        if (dayCount > 366) {
            throw new BusinessException("Khoảng ngày tối đa 366 ngày.");
        }
    }

    private RangeSkipCounts countManualRangeSkips(
            AuthUser authUser, Integer empCode, Integer deptCode, LocalDate from, LocalDate to, String targetStatus) {
        Map<LocalDate, AttendanceRecord> existingByDate = attendanceRepository
                .findByEmpCodeAndDateBetween(empCode, from, to).stream()
                .collect(Collectors.toMap(AttendanceRecord::getAttendanceDate, r -> r, (a, b) -> a));

        int assignable = 0;
        int skippedFingerprint = 0;
        int skippedReport = 0;

        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            AttendanceRecord record = existingByDate.get(day);
            if (record != null && AttendanceValidity.isPresenceStatus(record.getStatus())
                    && !isPostScanOverride(targetStatus)
                    && !authUser.isAdmin()) {
                skippedFingerprint++;
                continue;
            }
            assignable++;
        }
        return new RangeSkipCounts(assignable, skippedFingerprint, skippedReport);
    }

    private record RangeSkipCounts(int assignable, int skippedFingerprint, int skippedReport) {
    }

    private static boolean isPostScanOverride(String status) {
        return AttendanceValidity.VE_SOM.equals(status)
                || AttendanceValidity.NGHI_TRUC_HALF.equals(status)
                || AttendanceValidity.NGHI_TRUC_FULL.equals(status);
    }

    /**
     * Shared manual-status write — SPEC §4.8.1 / §4.13.4.
     */
    private void applyManualStatus(AuthUser authUser, AttendanceRecord record, String status, String note) {
        if (AttendanceValidity.VE_SOM.equals(status)) {
            String reason = note != null ? note.trim() : "";
            if (reason.isEmpty()) {
                throw new BusinessException("Về sớm bắt buộc nhập lý do.");
            }
            if (AttendanceValidity.punchCount(record) != 4) {
                throw new BusinessException("Về sớm chỉ áp dụng khi đã đủ 4 mốc giờ trong ngày.");
            }
            record.setStatus(status);
            record.setNote(reason);
            if (record.getMorningInAt() != null) {
                LocalTime morning = record.getMorningInAt().atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toLocalTime();
                record.setLateFlag(workScheduleService.current().isLate(morning));
            }
            record.setSource(record.getSource() != null ? "MIXED" : "MANUAL");
            AttendanceValidity.syncLegacyTimes(record);
            return;
        }
        if (AttendanceValidity.NGHI_TRUC_HALF.equals(status)) {
            if (record.getMorningInAt() == null || record.getNoonOutAt() == null) {
                throw new BusinessException(
                        "Nghỉ trực nửa ngày cần đủ giờ vào sáng và ra trưa trước khi chấm.");
            }
            if (AttendanceValidity.hasAfternoonPunch(record)) {
                throw new BusinessException(
                        "Nghỉ trực nửa ngày yêu cầu buổi chiều trống (không có vào chiều / ra chiều).");
            }
            record.setStatus(status);
            record.setNote(note);
            record.setSource(AttendanceValidity.punchCount(record) > 0 ? "MIXED" : "MANUAL");
            AttendanceValidity.syncLegacyTimes(record);
            return;
        }
        if (AttendanceValidity.NGHI_TRUC_FULL.equals(status)
                && AttendanceValidity.punchCount(record) > 0
                && authUser != null && authUser.isHead()) {
            throw new BusinessException(
                    "Nghỉ trực 1 ngày chỉ gán khi chưa có giờ quét. Liên hệ Admin nếu cần xóa giờ.");
        }
        record.setStatus(status);
        record.setNote(note);
        record.setMorningInAt(null);
        record.setNoonOutAt(null);
        record.setAfternoonInAt(null);
        record.setAfternoonOutAt(null);
        record.setLateFlag(false);
        record.setLastKioskHostname(null);
        record.setLastKioskIp(null);
        record.setLastKioskDeptCode(null);
        record.setLastKioskLabel(null);
        record.setCheckInAt(null);
        record.setCheckOutAt(null);
        record.setSource("MANUAL");
    }

    /**
     * Admin soft-clear day record to unchecked — SPEC §4.11.
     * Does not delete fingerprint_scan_logs. Allowed after report submit.
     *
     * @param authUser must be ADMIN
     * @param request  emp, optional date, mandatory reason
     * @return updated staff row
     */
    @Transactional
    public StaffAttendanceDto clearAttendanceDay(AuthUser authUser, ClearAttendanceRequest request) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được đưa Chấm công về chưa chấm");
        }
        String reason = request.getReason() != null ? request.getReason().trim() : "";
        if (reason.isEmpty()) {
            throw new BusinessException("Lý do không được để trống.");
        }

        Employee employee = employeeRepository.findByEmpCodeWithDept(request.getEmpCode())
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy nhân viên mã " + CodeFormatter.formatEmpCode(request.getEmpCode())));

        Integer deptCode = employee.getDepartment().getDeptCode();
        LocalDate date = request.getDate() != null ? request.getDate() : timeService.today();

        AttendanceRecord record = attendanceRepository
                .findByDateAndEmpCode(date, request.getEmpCode())
                .orElseThrow(() -> new BusinessException("Không có bản ghi Chấm công để đưa về chưa chấm."));

        boolean alreadyBlank = (record.getStatus() == null || record.getStatus().isBlank())
                && AttendanceValidity.punchCount(record) == 0;
        if (alreadyBlank) {
            throw new BusinessException("Nhân viên đã ở trạng thái chưa chấm.");
        }

        record.setStatus(null);
        record.setCheckInAt(null);
        record.setCheckOutAt(null);
        record.setMorningInAt(null);
        record.setNoonOutAt(null);
        record.setAfternoonInAt(null);
        record.setAfternoonOutAt(null);
        record.setLateFlag(false);
        record.setLastKioskHostname(null);
        record.setLastKioskIp(null);
        record.setLastKioskDeptCode(null);
        record.setLastKioskLabel(null);
        record.setSource("ADMIN");
        record.setNote(reason);
        AttendanceRecord saved = attendanceRepository.save(record);
        return toStaffDto(employee, deptCode, saved);
    }

    /**
     * Admin fills empty check-in / check-out only (SPEC §4.6 phương án X).
     *
     * @param authUser must be ADMIN
     * @param request  times for currently-null slots
     * @return updated staff row
     */
    @Transactional
    public StaffAttendanceDto fillAttendanceTimes(AuthUser authUser, FillAttendanceTimesRequest request) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được điền giờ vào/ra bị thiếu");
        }

        Employee employee = employeeRepository.findByEmpCodeWithDept(request.getEmpCode())
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy nhân viên mã " + CodeFormatter.formatEmpCode(request.getEmpCode())));

        Integer deptCode = employee.getDepartment().getDeptCode();
        LocalDate date = request.getDate() != null ? request.getDate() : timeService.today();

        AttendanceRecord record = attendanceRepository
                .findByDateAndEmpCode(date, request.getEmpCode())
                .orElseGet(() -> {
                    AttendanceRecord r = new AttendanceRecord();
                    r.setAttendanceDate(date);
                    r.setEmployee(employee);
                    r.setStatus(null);
                    return r;
                });

        if (AttendanceValidity.isManualStatus(record.getStatus())) {
            throw new BusinessException(
                    "Nhân viên đang " + statusCatalogService.resolveLabel(record.getStatus())
                            + " — không cần điền giờ vào/ra.");
        }

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        WorkSchedule schedule = workScheduleService.current();
        boolean changed = false;

        String morningInRaw = firstNonBlank(request.getMorningInTime(), request.getCheckInTime());
        String noonOutRaw = request.getNoonOutTime();
        String afternoonInRaw = request.getAfternoonInTime();
        String afternoonOutRaw = firstNonBlank(request.getAfternoonOutTime(), request.getCheckOutTime());

        changed |= fillSlot(record, date, zone, morningInRaw, record.getMorningInAt(),
                "Giờ vào sáng", record::setMorningInAt);
        changed |= fillSlot(record, date, zone, noonOutRaw, record.getNoonOutAt(),
                "Giờ ra trưa", record::setNoonOutAt);
        changed |= fillSlot(record, date, zone, afternoonInRaw, record.getAfternoonInAt(),
                "Giờ vào chiều", record::setAfternoonInAt);
        changed |= fillSlot(record, date, zone, afternoonOutRaw, record.getAfternoonOutAt(),
                "Giờ ra chiều", record::setAfternoonOutAt);

        if (!changed) {
            throw new BusinessException("Nhập ít nhất một giờ đang trống.");
        }

        applyFillTimesStatus(record, schedule);
        AttendanceValidity.syncLegacyTimes(record);
        if (record.getSource() == null || record.getSource().isBlank()) {
            record.setSource("ADMIN");
        }
        AttendanceRecord saved = attendanceRepository.save(record);
        return toStaffDto(employee, deptCode, saved);
    }

    private static String firstNonBlank(String primary, String alias) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        if (alias != null && !alias.isBlank()) {
            return alias.trim();
        }
        return null;
    }

    private boolean fillSlot(
            AttendanceRecord record,
            LocalDate date,
            ZoneId zone,
            String rawTime,
            Instant existing,
            String label,
            java.util.function.Consumer<Instant> setter) {
        if (rawTime == null || rawTime.isBlank()) {
            return false;
        }
        if (existing != null) {
            throw new BusinessException(label + " đã có — không được ghi đè.");
        }
        setter.accept(date.atTime(parseHm(rawTime)).atZone(zone).toInstant());
        return true;
    }

    private void applyFillTimesStatus(AttendanceRecord record, WorkSchedule schedule) {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        if (AttendanceValidity.punchCount(record) == 4) {
            LocalTime morning = record.getMorningInAt().atZone(zone).toLocalTime();
            LocalTime afternoonOut = record.getAfternoonOutAt().atZone(zone).toLocalTime();
            boolean late = schedule.isLate(morning);
            record.setLateFlag(late);
            if (schedule.isEarlyLeave(afternoonOut)) {
                AttendanceValidity.applyClockStatus(record, AttendanceValidity.VE_SOM);
            } else {
                AttendanceValidity.applyClockStatus(record, late
                        ? AttendanceStatus.DI_TRE.name()
                        : AttendanceStatus.DI_LAM.name());
            }
            return;
        }
        if (record.getMorningInAt() != null
                && (record.getStatus() == null || record.getStatus().isBlank()
                || AttendanceValidity.isPresenceStatus(record.getStatus()))) {
            LocalTime inTime = record.getMorningInAt().atZone(zone).toLocalTime();
            record.setStatus(AttendanceValidity.statusFromCheckInTime(inTime, schedule.lateCutoff()));
            record.setLateFlag(schedule.isLate(inTime));
        }
    }

    private static LocalTime parseHm(String raw) {
        try {
            if (raw.length() == 5) {
                return LocalTime.parse(raw, DateTimeFormatter.ofPattern("HH:mm"));
            }
            return LocalTime.parse(raw, DateTimeFormatter.ofPattern("HH:mm:ss"));
        } catch (DateTimeParseException ex) {
            throw new BusinessException("Giờ không hợp lệ (dùng HH:mm)");
        }
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

    /** SPEC §4.5 P5 — report-submit deprecated. */
    @Transactional
    public void submitReport(AuthUser authUser, Integer deptCode, LocalDate date) {
        throw new BusinessException(
                "Chức năng gửi báo cáo khoa đã ngừng sử dụng. Dữ liệu Chấm công hiển thị realtime cho Admin.");
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

    /** @deprecated P5 — no report-submit gate */
    private void assertReportNotSubmittedForHead(AuthUser authUser, Integer deptCode, LocalDate date) {
        // no-op — soft-lock via AttendanceLockService.assertCanWrite
    }

    /** SPEC §4.8 — HEAD may only assign active manualAllowed statuses, never presence/group parent. */
    private void assertHeadManualStatus(String status) {
        if (AttendanceValidity.isPresenceStatus(status)) {
            throw new BusinessException("Đi làm / Đi trễ chỉ ghi nhận qua vân tay.");
        }
        statusCatalogService.assertManualAssignableStatus(status);
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
        // editable already includes reportBlocked via AttendanceLockService.isEditable (SPEC_AI §3.2)

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
                records.stream()
                        .filter(AttendanceValidity::isComplete)
                        .map(AttendanceRecord::getStatus)
                        .toList());
    }

    /**
     * Paginated fingerprint scan logs for one employee on a VN calendar day (SPEC §10.3).
     *
     * @param empCode employee code
     * @param date    attendance date (Asia/Ho_Chi_Minh)
     * @param page    1-based page
     * @param pageSize page size (capped at 50)
     * @return page of scan log items
     * @throws AccessDeniedException if HEAD views another dept
     * @throws BusinessException if employee missing
     */
    @Transactional(readOnly = true)
    public ScanLogPageDto listScanLogs(
            AuthUser authUser, Integer empCode, LocalDate date, int page, int pageSize) {
        if (empCode == null) {
            throw new BusinessException("Thiếu mã nhân viên");
        }
        if (date == null) {
            date = timeService.today();
        }
        Employee employee = employeeRepository.findByEmpCodeWithDept(empCode)
                .orElseThrow(() -> new BusinessException(
                        "Nhân viên không tồn tại: " + CodeFormatter.formatEmpCode(empCode)));
        Integer empDept = employee.getDepartment().getDeptCode();
        lockService.assertCanView(authUser, empDept);

        int safePage = Math.max(1, page);
        int safeSize = Math.min(50, Math.max(1, pageSize));
        Instant from = date.atStartOfDay(VietnamTimeService.ZONE).toInstant();
        Instant to = date.plusDays(1).atStartOfDay(VietnamTimeService.ZONE).toInstant();

        Page<FingerprintScanLog> result = scanLogRepository
                .findByEmpCodeAndScannedAtGreaterThanEqualAndScannedAtLessThanOrderByScannedAtAsc(
                        empCode, from, to, PageRequest.of(safePage - 1, safeSize));

        List<ScanLogItemDto> items = result.getContent().stream()
                .map(log -> ScanLogItemDto.builder()
                        .scannedAt(log.getScannedAt())
                        .direction(log.getDirection())
                        .score(log.getScore())
                        .message(log.getMessage())
                        .clientHostname(log.getClientHostname())
                        .clientIp(log.getClientIp())
                        .kioskLabel(log.getKioskLabel())
                        .build())
                .toList();

        return ScanLogPageDto.builder()
                .empCode(empCode)
                .empCodeFormatted(CodeFormatter.formatEmpCode(empCode))
                .fullname(employee.getFullname())
                .date(date)
                .items(items)
                .page(safePage)
                .pageSize(safeSize)
                .totalItems(result.getTotalElements())
                .totalPages(Math.max(1, result.getTotalPages()))
                .build();
    }

    /**
     * Lists merged manual-status periods for one employee (SPEC §3.2.2).
     */
    @Transactional(readOnly = true)
    public ManualScheduleDto listManualSchedule(
            AuthUser authUser, Integer empCode, LocalDate from, LocalDate to) {
        if (empCode == null) {
            throw new BusinessException("Thiếu mã nhân viên");
        }
        LocalDate today = timeService.today();
        LocalDate rangeFrom = from != null ? from : today.minusDays(30);
        LocalDate rangeTo = to != null ? to : today.plusDays(365);
        if (rangeTo.isBefore(rangeFrom)) {
            throw new BusinessException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }
        long span = ChronoUnit.DAYS.between(rangeFrom, rangeTo) + 1;
        if (span > 400) {
            throw new BusinessException("Khoảng xem lịch thủ công tối đa 400 ngày.");
        }

        Employee employee = employeeRepository.findByEmpCodeWithDept(empCode)
                .orElseThrow(() -> new BusinessException(
                        "Nhân viên không tồn tại: " + CodeFormatter.formatEmpCode(empCode)));
        Integer empDept = employee.getDepartment().getDeptCode();
        lockService.assertCanView(authUser, empDept);

        List<AttendanceRecord> records = attendanceRepository
                .findByEmpCodeAndDateBetween(empCode, rangeFrom, rangeTo).stream()
                .filter(r -> AttendanceValidity.isManualStatus(r.getStatus()))
                .sorted(Comparator.comparing(AttendanceRecord::getAttendanceDate))
                .toList();

        List<ManualSchedulePeriodDto> periods = mergeManualPeriods(records);

        return ManualScheduleDto.builder()
                .empCode(empCode)
                .empCodeFormatted(CodeFormatter.formatEmpCode(empCode))
                .fullname(employee.getFullname())
                .from(rangeFrom)
                .to(rangeTo)
                .items(periods)
                .build();
    }

    private List<ManualSchedulePeriodDto> mergeManualPeriods(List<AttendanceRecord> records) {
        if (records.isEmpty()) {
            return List.of();
        }
        List<ManualSchedulePeriodDto> out = new ArrayList<>();
        LocalDate periodStart = records.get(0).getAttendanceDate();
        LocalDate periodEnd = periodStart;
        String status = records.get(0).getStatus();

        for (int i = 1; i < records.size(); i++) {
            AttendanceRecord r = records.get(i);
            LocalDate d = r.getAttendanceDate();
            String s = r.getStatus();
            if (s != null && s.equals(status) && d.equals(periodEnd.plusDays(1))) {
                periodEnd = d;
                continue;
            }
            out.add(periodDto(periodStart, periodEnd, status));
            periodStart = d;
            periodEnd = d;
            status = s;
        }
        out.add(periodDto(periodStart, periodEnd, status));
        return out;
    }

    private ManualSchedulePeriodDto periodDto(LocalDate from, LocalDate to, String status) {
        int days = (int) (ChronoUnit.DAYS.between(from, to) + 1);
        return ManualSchedulePeriodDto.builder()
                .fromDate(from)
                .toDate(to)
                .dayCount(days)
                .status(status)
                .statusLabel(statusCatalogService.resolveLabel(status))
                .build();
    }

    /**
     * SPEC §4.5.2 P5 — missing punch / unmarked queue.
     * HEAD: own dept. ADMIN: omit deptCode = all active depts.
     */
    @Transactional(readOnly = true)
    public MissingPunchesResponseDto listMissingPunches(
            AuthUser authUser, Integer departmentCode, LocalDate date) {
        if (authUser.isAdmin() && departmentCode == null) {
            return buildMissingPunchesAllDepts(date);
        }
        Integer deptCode = resolveDeptCode(authUser, departmentCode);
        lockService.assertCanView(authUser, deptCode);
        return MissingPunchesResponseDto.builder()
                .date(date)
                .items(collectMissingForDept(deptCode, date))
                .build();
    }

    /** System job — no auth (reminder scheduler). */
    @Transactional(readOnly = true)
    public MissingPunchesResponseDto listMissingPunchesForSystem(LocalDate date) {
        return buildMissingPunchesAllDepts(date);
    }

    private MissingPunchesResponseDto buildMissingPunchesAllDepts(LocalDate date) {
        List<MissingPunchItemDto> items = new ArrayList<>();
        for (Department dept : departmentRepository.findAll()) {
            if (!dept.isActive()) {
                continue;
            }
            items.addAll(collectMissingForDept(dept.getDeptCode(), date));
        }
        return MissingPunchesResponseDto.builder().date(date).items(items).build();
    }

    private List<MissingPunchItemDto> collectMissingForDept(Integer deptCode, LocalDate date) {
        Department dept = departmentRepository.findById(deptCode).orElse(null);
        if (dept == null || !dept.isActive()) {
            return List.of();
        }
        List<Employee> employees = staffForAttendance(employeeRepository.findByDeptCode(deptCode));
        Map<Integer, AttendanceRecord> recordMap = attendanceRepository
                .findByDateAndDeptCode(date, deptCode).stream()
                .collect(Collectors.toMap(AttendanceRecord::getEmpCode, r -> r, (a, b) -> a));

        List<MissingPunchItemDto> items = new ArrayList<>();
        for (Employee emp : employees) {
            AttendanceRecord record = recordMap.get(emp.getEmpCode());
            String status = record != null ? record.getStatus() : null;
            if (AttendanceValidity.isComplete(record)) {
                continue;
            }
            int punches = AttendanceValidity.punchCount(record);
            String reason;
            if (AttendanceValidity.VE_SOM.equals(status)) {
                reason = "MISSING_EARLY_LEAVE_REASON";
            } else if (punches >= 1 && punches <= 3) {
                reason = "INCOMPLETE_PUNCHES";
            } else if (AttendanceValidity.isPresenceStatus(status) && punches == 4
                    && (record.getNote() == null || record.getNote().isBlank())
                    && AttendanceValidity.VE_SOM.equals(status)) {
                reason = "MISSING_EARLY_LEAVE_REASON";
            } else {
                reason = "UNMARKED";
            }
            items.add(MissingPunchItemDto.builder()
                    .empCode(emp.getEmpCode())
                    .empCodeFormatted(CodeFormatter.formatEmpCode(emp.getEmpCode()))
                    .fullName(emp.getFullname())
                    .deptCode(deptCode)
                    .deptCodeFormatted(CodeFormatter.formatDeptCode(deptCode))
                    .deptName(dept.getDeptName())
                    .status(status)
                    .statusLabel(status != null ? statusCatalogService.resolveLabel(status) : null)
                    .checkInAt(record != null ? record.getCheckInAt() : null)
                    .checkOutAt(record != null ? record.getCheckOutAt() : null)
                    .reason(reason)
                    .build());
        }
        return items;
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
                .checkInAt(record != null ? record.getCheckInAt() : null)
                .checkOutAt(record != null ? record.getCheckOutAt() : null)
                .morningInAt(record != null ? record.getMorningInAt() : null)
                .noonOutAt(record != null ? record.getNoonOutAt() : null)
                .afternoonInAt(record != null ? record.getAfternoonInAt() : null)
                .afternoonOutAt(record != null ? record.getAfternoonOutAt() : null)
                .lateFlag(record != null && record.isLateFlag())
                .lastKioskHostname(record != null ? record.getLastKioskHostname() : null)
                .lastKioskIp(record != null ? record.getLastKioskIp() : null)
                .lastKioskDeptCode(record != null ? record.getLastKioskDeptCode() : null)
                .lastKioskLabel(record != null ? record.getLastKioskLabel() : null)
                .source(record != null ? record.getSource() : null)
                .build();
    }
}
