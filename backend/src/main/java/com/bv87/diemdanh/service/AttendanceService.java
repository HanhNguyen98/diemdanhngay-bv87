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
    private final AttendanceReportSubmissionRepository reportSubmissionRepository;
    private final AttendanceReportBlockRepository reportBlockRepository;
    private final AttendanceLockService lockService;
    private final VietnamTimeService timeService;
    private final AiPendingActionStore pendingActionStore;

    public List<DepartmentDto> getAllDepartments(AuthUser authUser) {
        LocalDate today = timeService.today();
        AccountRole role = authUser.getAccount().getRole();
        return departmentRepository.findAll().stream()
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

        long diLam = 0, nghiPhep = 0, diHoc = 0, diCongTac = 0;
        for (Employee emp : employees) {
            AttendanceRecord record = recordMap.get(emp.getEmpCode());
            if (record == null) {
                continue;
            }
            switch (record.getStatus()) {
                case DI_LAM -> diLam++;
                case NGHI_PHEP -> nghiPhep++;
                case DI_HOC -> diHoc++;
                case DI_CONG_TAC -> diCongTac++;
            }
        }

        return buildSummary(dept, date, employees.size(), diLam, nghiPhep, diHoc, diCongTac,
                authUser.getAccount().getRole());
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
                .sorted(Comparator.comparing(Department::getDeptCode))
                .toList();
        Map<Integer, Long> totalsByDept = loadActiveEmployeeCountsByDept();
        Map<Integer, StatusCounts> countsByDept = loadStatusCountsByDeptForDate(date);

        return departments.stream()
                .map(dept -> {
                    Integer deptCode = dept.getDeptCode();
                    StatusCounts counts = countsByDept.getOrDefault(deptCode, new StatusCounts());
                    int total = totalsByDept.getOrDefault(deptCode, 0L).intValue();
                    return buildSummary(
                            dept, date, total,
                            counts.diLam, counts.nghiPhep, counts.diHoc, counts.diCongTac,
                            role);
                })
                .toList();
    }

    private Map<Integer, Long> loadActiveEmployeeCountsByDept() {
        Map<Integer, Long> map = new HashMap<>();
        for (Object[] row : employeeRepository.countActiveByDeptCode()) {
            map.put((Integer) row[0], (Long) row[1]);
        }
        return map;
    }

    private Map<Integer, StatusCounts> loadStatusCountsByDeptForDate(LocalDate date) {
        Map<Integer, StatusCounts> map = new HashMap<>();
        for (AttendanceRecord record : attendanceRepository.findByDate(date)) {
            Integer deptCode = record.getEmployee().getDepartment().getDeptCode();
            map.computeIfAbsent(deptCode, ignored -> new StatusCounts()).add(record.getStatus());
        }
        return map;
    }

    @Transactional
    public Map<String, Object> previewBatchAttendance(
            AuthUser authUser, LocalDate date, AttendanceStatus status, String scope) {
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Chỉ Trưởng đơn vị mới chấm công hàng loạt qua AI");
        }
        Integer deptCode = authUser.getDeptCode();
        if (deptCode == null) {
            throw new BusinessException("Tài khoản chưa gắn mã Đơn vị");
        }
        lockService.assertCanWrite(authUser, deptCode, date);

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
            if (allStaff && record != null && record.getStatus() != status) {
                overwriteCount++;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("empCode", emp.getEmpCode());
            item.put("empCodeFormatted", CodeFormatter.formatEmpCode(emp.getEmpCode()));
            item.put("fullname", emp.getFullname());
            item.put("currentStatus", record != null ? record.getStatus().name() : null);
            item.put("currentStatusLabel", record != null ? record.getStatus().getLabel() : "Chưa xác nhận");
            targets.add(item);
        }

        List<Integer> empCodes = targets.stream().map(t -> (Integer) t.get("empCode")).toList();
        String actionId = pendingActionStore.saveBatchAttendanceAction(
                deptCode, date, status, scope, empCodes);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("actionId", actionId);
        result.put("date", date.toString());
        result.put("status", status.name());
        result.put("statusLabel", status.getLabel());
        result.put("scope", scope);
        result.put("scopeLabel", allStaff ? "Toàn bộ nhân viên" : "Chỉ nhân viên chưa xác nhận");
        result.put("targetCount", targets.size());
        result.put("overwriteCount", overwriteCount);
        result.put("staff", targets);
        return result;
    }

    @Transactional
    public Map<String, Object> confirmBatchAttendance(AuthUser authUser, String actionId) {
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Chỉ Trưởng đơn vị mới chấm công hàng loạt qua AI");
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
                "status", action.status().name(),
                "statusLabel", action.status().getLabel(),
                "message", String.format("Đã chấm công %s cho %d nhân viên.", action.status().getLabel(), updated));
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

        long diLam = 0, nghiPhep = 0, diHoc = 0, diCongTac = 0;
        for (Employee emp : employees) {
            AttendanceRecord record = recordMap.get(emp.getEmpCode());
            if (record == null) {
                continue;
            }
            switch (record.getStatus()) {
                case DI_LAM -> diLam++;
                case NGHI_PHEP -> nghiPhep++;
                case DI_HOC -> diHoc++;
                case DI_CONG_TAC -> diCongTac++;
            }
        }

        AttendanceSummaryDto summary = buildSummary(
                dept, date, employees.size(), diLam, nghiPhep, diHoc, diCongTac,
                authUser.getAccount().getRole());

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
                .statusLabel(saved.getStatus().getLabel())
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
            long diLam,
            long nghiPhep,
            long diHoc,
            long diCongTac,
            AccountRole role) {
        Integer deptCode = dept.getDeptCode();
        boolean locked = lockService.isDepartmentLocked(deptCode, date);
        boolean unlocked = lockService.isUnlocked(deptCode, date);
        boolean editable = lockService.isEditable(deptCode, role, date);
        long markedCount = diLam + nghiPhep + diHoc + diCongTac;
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
                .total(total)
                .diLam(diLam)
                .nghiPhep(nghiPhep)
                .diHoc(diHoc)
                .diCongTac(diCongTac)
                .locked(locked)
                .unlocked(unlocked)
                .editable(editable)
                .lockTime(timeService.formatLockTime())
                .lockMessage(locked ? lockService.buildLockMessage() : null)
                .markedCount(markedCount)
                .uncheckedCount(uncheckedCount)
                .progressPercent(progressPercent)
                .completionStatus(completionStatus)
                .reportSubmitted(reportSubmitted)
                .reportBlocked(reportBlocked)
                .build();
    }

    /** Nhân viên đang hoạt động của phòng — gồm cả trưởng phòng; không lọc theo chức vụ. */
    private List<Employee> staffForAttendance(List<Employee> employees) {
        return employees.stream()
                .filter(Employee::isActive)
                .toList();
    }

    private static final class StatusCounts {
        long diLam;
        long nghiPhep;
        long diHoc;
        long diCongTac;

        void add(AttendanceStatus status) {
            switch (status) {
                case DI_LAM -> diLam++;
                case NGHI_PHEP -> nghiPhep++;
                case DI_HOC -> diHoc++;
                case DI_CONG_TAC -> diCongTac++;
            }
        }
    }

    private StaffAttendanceDto toStaffDto(Employee emp, Integer deptCode, AttendanceRecord record) {
        AttendanceStatus status = record != null ? record.getStatus() : null;
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
                .statusLabel(status != null ? status.getLabel() : null)
                .note(record != null ? record.getNote() : null)
                .build();
    }
}
