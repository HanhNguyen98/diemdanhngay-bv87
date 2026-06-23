package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AdminAccountService adminAccountService;
    private final SettingsService settingsService;
    private final AuthService authService;
    private final AdminDashboardService adminDashboardService;
    private final AttendanceReminderService attendanceReminderService;
    private final AttendanceReportService attendanceReportService;
    private final AttendanceStatusCatalogService statusCatalogService;
    private final StaffRankCatalogService staffRankCatalogService;
    private final StaffPositionCatalogService staffPositionCatalogService;
    private final AttendanceService attendanceService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats(authService.getAuthUser()));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDto> getDashboard() {
        return ResponseEntity.ok(adminDashboardService.getDashboard(authService.getAuthUser()));
    }

    @PostMapping("/attendance/reminders")
    public ResponseEntity<SendReminderResultDto> sendReminders(@Valid @RequestBody SendReminderRequest request) {
        return ResponseEntity.ok(attendanceReminderService.sendManualReminders(
                authService.getAuthUser(), request.getDeptCodes()));
    }

    @GetMapping("/attendance/reminder-history")
    public ResponseEntity<ReminderHistoryDto> getReminderHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(attendanceReminderService.getReminderHistory(
                authService.getAuthUser(), from, to));
    }

    @PostMapping("/attendance/report-blocks")
    public ResponseEntity<Map<String, String>> blockReport(@Valid @RequestBody ReportBlockRequest request) {
        attendanceReportService.blockReport(authService.getAuthUser(), request);
        return ResponseEntity.ok(Map.of("message", "Đã khóa gửi báo cáo cho ĐƠN VỊ"));
    }

    @DeleteMapping("/attendance/report-blocks/{deptCode}")
    public ResponseEntity<Map<String, String>> unblockReport(@PathVariable Integer deptCode) {
        attendanceReportService.unblockReport(authService.getAuthUser(), deptCode);
        return ResponseEntity.ok(Map.of("message", "Đã mở khóa gửi báo cáo cho ĐƠN VỊ"));
    }

    @PostMapping("/attendance/toggle-lock/{deptCode}")
    public ResponseEntity<ToggleDeptLockResultDto> toggleDepartmentLock(@PathVariable Integer deptCode) {
        return ResponseEntity.ok(
                attendanceService.toggleDepartmentLock(authService.getAuthUser(), deptCode));
    }

    @GetMapping("/department-groups/next-code")
    public ResponseEntity<NextCodeDto> getNextGroupCode() {
        return ResponseEntity.ok(adminService.getNextGroupCode(authService.getAuthUser()));
    }

    @GetMapping("/department-groups")
    public ResponseEntity<List<AdminDepartmentGroupDto>> listDepartmentGroups() {
        return ResponseEntity.ok(adminService.listDepartmentGroups(authService.getAuthUser()));
    }

    @PostMapping("/department-groups")
    public ResponseEntity<AdminDepartmentGroupDto> createDepartmentGroup(
            @Valid @RequestBody DepartmentGroupUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createDepartmentGroup(authService.getAuthUser(), request));
    }

    @PutMapping("/department-groups/{groupCode}")
    public ResponseEntity<AdminDepartmentGroupDto> updateDepartmentGroup(
            @PathVariable Integer groupCode,
            @Valid @RequestBody DepartmentGroupUpsertRequest request) {
        return ResponseEntity.ok(
                adminService.updateDepartmentGroup(authService.getAuthUser(), groupCode, request));
    }

    @DeleteMapping("/department-groups/{groupCode}")
    public ResponseEntity<Map<String, String>> deleteDepartmentGroup(@PathVariable Integer groupCode) {
        adminService.deleteDepartmentGroup(authService.getAuthUser(), groupCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa nhóm Đơn vị"));
    }

    @GetMapping("/departments/next-code")
    public ResponseEntity<NextCodeDto> getNextDeptCode() {
        return ResponseEntity.ok(adminService.getNextDeptCode(authService.getAuthUser()));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<AdminDepartmentDto>> listDepartments(
            @RequestParam(required = false) Integer groupCode) {
        return ResponseEntity.ok(adminService.listDepartments(authService.getAuthUser(), groupCode));
    }

    @GetMapping("/departments/{deptCode}")
    public ResponseEntity<AdminDepartmentDto> getDepartment(@PathVariable Integer deptCode) {
        return ResponseEntity.ok(adminService.getDepartment(authService.getAuthUser(), deptCode));
    }

    @PostMapping("/departments")
    public ResponseEntity<AdminDepartmentDto> createDepartment(@Valid @RequestBody DepartmentUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createDepartment(authService.getAuthUser(), request));
    }

    @PutMapping("/departments/{deptCode}")
    public ResponseEntity<AdminDepartmentDto> updateDepartment(
            @PathVariable Integer deptCode,
            @Valid @RequestBody DepartmentUpsertRequest request) {
        return ResponseEntity.ok(adminService.updateDepartment(authService.getAuthUser(), deptCode, request));
    }

    @DeleteMapping("/departments/{deptCode}")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable Integer deptCode) {
        adminService.deleteDepartment(authService.getAuthUser(), deptCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa Đơn vị"));
    }

    @GetMapping("/staff/next-code")
    public ResponseEntity<NextCodeDto> getNextEmpCode(@RequestParam Integer deptCode) {
        return ResponseEntity.ok(adminService.getNextEmpCode(authService.getAuthUser(), deptCode));
    }

    @GetMapping("/staff")
    public ResponseEntity<RegistryPageDto<AdminStaffDto>> listStaff(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer deptCode,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(
                adminService.listStaffPage(authService.getAuthUser(), search, deptCode, page, pageSize));
    }

    @GetMapping("/staff/{empCode}")
    public ResponseEntity<AdminStaffDto> getStaff(@PathVariable Integer empCode) {
        return ResponseEntity.ok(adminService.getStaff(authService.getAuthUser(), empCode));
    }

    @GetMapping("/staff/{empCode}/department-history")
    public ResponseEntity<List<StaffDepartmentAssignmentDto>> getStaffDepartmentHistory(
            @PathVariable Integer empCode) {
        return ResponseEntity.ok(adminService.listStaffDepartmentHistory(authService.getAuthUser(), empCode));
    }

    @PostMapping("/staff")
    public ResponseEntity<AdminStaffDto> createStaff(@Valid @RequestBody StaffUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createStaff(authService.getAuthUser(), request));
    }

    @PutMapping("/staff/{empCode}")
    public ResponseEntity<AdminStaffDto> updateStaff(
            @PathVariable Integer empCode,
            @Valid @RequestBody StaffUpsertRequest request) {
        return ResponseEntity.ok(adminService.updateStaff(authService.getAuthUser(), empCode, request));
    }

    @DeleteMapping("/staff/{empCode}")
    public ResponseEntity<Map<String, String>> deleteStaff(@PathVariable Integer empCode) {
        adminService.deleteStaff(authService.getAuthUser(), empCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa Nhân viên"));
    }

    @GetMapping("/attendance-status-types")
    public ResponseEntity<List<AttendanceStatusTypeDto>> listAttendanceStatusTypes() {
        return ResponseEntity.ok(statusCatalogService.listAll(authService.getAuthUser()));
    }

    @GetMapping("/attendance-status-types/{id}")
    public ResponseEntity<AttendanceStatusTypeDto> getAttendanceStatusType(@PathVariable Long id) {
        return ResponseEntity.ok(statusCatalogService.getById(authService.getAuthUser(), id));
    }

    @PostMapping("/attendance-status-types")
    public ResponseEntity<AttendanceStatusTypeDto> createAttendanceStatusType(
            @Valid @RequestBody AttendanceStatusTypeUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(statusCatalogService.create(authService.getAuthUser(), request));
    }

    @PutMapping("/attendance-status-types/{id}")
    public ResponseEntity<AttendanceStatusTypeDto> updateAttendanceStatusType(
            @PathVariable Long id,
            @Valid @RequestBody AttendanceStatusTypeUpsertRequest request) {
        return ResponseEntity.ok(statusCatalogService.update(authService.getAuthUser(), id, request));
    }

    @DeleteMapping("/attendance-status-types/{id}")
    public ResponseEntity<Map<String, String>> deleteAttendanceStatusType(@PathVariable Long id) {
        statusCatalogService.delete(authService.getAuthUser(), id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa trạng thái"));
    }

    @GetMapping("/staff-ranks/next-code")
    public ResponseEntity<NextCodeDto> getNextStaffRankCode() {
        return ResponseEntity.ok(staffRankCatalogService.getNextCode(authService.getAuthUser()));
    }

    @GetMapping("/staff-ranks")
    public ResponseEntity<List<StaffRankDto>> listStaffRanks() {
        return ResponseEntity.ok(staffRankCatalogService.listAll(authService.getAuthUser()));
    }

    @PostMapping("/staff-ranks")
    public ResponseEntity<StaffRankDto> createStaffRank(@Valid @RequestBody StaffRankUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffRankCatalogService.create(authService.getAuthUser(), request));
    }

    @PutMapping("/staff-ranks/{rankCode}")
    public ResponseEntity<StaffRankDto> updateStaffRank(
            @PathVariable Integer rankCode,
            @Valid @RequestBody StaffRankUpsertRequest request) {
        return ResponseEntity.ok(
                staffRankCatalogService.update(authService.getAuthUser(), rankCode, request));
    }

    @DeleteMapping("/staff-ranks/{rankCode}")
    public ResponseEntity<Map<String, String>> deleteStaffRank(@PathVariable Integer rankCode) {
        staffRankCatalogService.delete(authService.getAuthUser(), rankCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa cấp bậc"));
    }

    @GetMapping("/staff-positions/next-code")
    public ResponseEntity<NextCodeDto> getNextStaffPositionCode() {
        return ResponseEntity.ok(staffPositionCatalogService.getNextCode(authService.getAuthUser()));
    }

    @GetMapping("/staff-positions")
    public ResponseEntity<List<StaffPositionDto>> listStaffPositions() {
        return ResponseEntity.ok(staffPositionCatalogService.listAll(authService.getAuthUser()));
    }

    @PostMapping("/staff-positions")
    public ResponseEntity<StaffPositionDto> createStaffPosition(
            @Valid @RequestBody StaffPositionUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffPositionCatalogService.create(authService.getAuthUser(), request));
    }

    @PutMapping("/staff-positions/{positionCode}")
    public ResponseEntity<StaffPositionDto> updateStaffPosition(
            @PathVariable Integer positionCode,
            @Valid @RequestBody StaffPositionUpsertRequest request) {
        return ResponseEntity.ok(
                staffPositionCatalogService.update(authService.getAuthUser(), positionCode, request));
    }

    @DeleteMapping("/staff-positions/{positionCode}")
    public ResponseEntity<Map<String, String>> deleteStaffPosition(@PathVariable Integer positionCode) {
        staffPositionCatalogService.delete(authService.getAuthUser(), positionCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa chức vụ"));
    }

    @GetMapping("/settings/branding")
    public ResponseEntity<BrandingDto> getBranding() {
        return ResponseEntity.ok(settingsService.getBranding());
    }

    @PutMapping("/settings/branding")
    public ResponseEntity<BrandingDto> updateBranding(@Valid @RequestBody BrandingUpdateRequest request) {
        return ResponseEntity.ok(settingsService.updateBranding(authService.getAuthUser(), request));
    }

    @GetMapping("/accounts/stats")
    public ResponseEntity<AccountStatsDto> getAccountStats() {
        return ResponseEntity.ok(adminAccountService.getAccountStats(authService.getAuthUser()));
    }

    @GetMapping("/accounts")
    public ResponseEntity<RegistryPageDto<AdminAccountDto>> listAccounts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(adminAccountService.listAccountsPage(
                authService.getAuthUser(), search, role, status, page, pageSize));
    }

    @PostMapping("/accounts")
    public ResponseEntity<AdminAccountDto> createAccount(@Valid @RequestBody AccountUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminAccountService.createAccount(authService.getAuthUser(), request));
    }

    @PutMapping("/accounts/{accountId}")
    public ResponseEntity<AdminAccountDto> updateAccount(
            @PathVariable Long accountId,
            @Valid @RequestBody AccountUpsertRequest request) {
        return ResponseEntity.ok(adminAccountService.updateAccount(authService.getAuthUser(), accountId, request));
    }

    @DeleteMapping("/accounts/{accountId}")
    public ResponseEntity<Map<String, String>> deleteAccount(@PathVariable Long accountId) {
        adminAccountService.deleteAccount(authService.getAuthUser(), accountId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa tài khoản"));
    }

    @PostMapping("/accounts/{accountId}/reset-password")
    public ResponseEntity<Map<String, String>> resetAccountPassword(
            @PathVariable Long accountId,
            @Valid @RequestBody ResetPasswordRequest request) {
        adminAccountService.resetPassword(authService.getAuthUser(), accountId, request);
        return ResponseEntity.ok(Map.of("message", "Đã đặt lại mật khẩu thành công"));
    }
}
