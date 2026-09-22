package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.enums.UnlockRequestStatus;
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
@PreAuthorize("hasAnyRole('ADMIN','DUTY')")
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
    private final FingerprintService fingerprintService;
    private final FingerprintTemplateAuditService templateAuditService;
    private final AuditService auditService;
    private final AttendanceUnlockRequestService unlockRequestService;
    private final ServerStorageService serverStorageService;
    private final AccountScreenService accountScreenService;
    private final PermissionGroupService permissionGroupService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats(authService.getAuthUser()));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDto> getDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(adminDashboardService.getDashboard(authService.getAuthUser(), date));
    }

    @GetMapping("/system/storage")
    public ResponseEntity<ServerStorageDto> getServerStorage() {
        return ResponseEntity.ok(serverStorageService.getStorage());
    }

    /** Manual per-department reminders for the requested attendance date (D-UAT.4). */
    @PostMapping("/attendance/reminders")
    public ResponseEntity<SendReminderResultDto> sendReminders(@Valid @RequestBody SendReminderRequest request) {
        return ResponseEntity.ok(attendanceReminderService.sendManualReminders(
                authService.getAuthUser(), request.getDeptCodes(), request.getDate()));
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

    @PutMapping("/attendance/times")
    public ResponseEntity<StaffAttendanceDto> fillAttendanceTimes(
            @Valid @RequestBody FillAttendanceTimesRequest request) {
        return ResponseEntity.ok(attendanceService.fillAttendanceTimes(authService.getAuthUser(), request));
    }

    @PostMapping("/attendance/payroll-fill/approve")
    public ResponseEntity<StaffAttendanceDto> approvePayrollFill(
            @Valid @RequestBody PayrollFillApproveRequest request) {
        return ResponseEntity.ok(attendanceService.approvePayrollFill(authService.getAuthUser(), request));
    }

    @PostMapping("/attendance/clear")
    public ResponseEntity<StaffAttendanceDto> clearAttendance(
            @Valid @RequestBody ClearAttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.clearAttendanceDay(authService.getAuthUser(), request));
    }

    @GetMapping("/attendance/audit-logs")
    public ResponseEntity<AttendanceAuditLogPageDto> listAttendanceAuditLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer deptCode,
            @RequestParam(required = false) String username,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(auditService.listAttendanceLogs(
                authService.getAuthUser(), from, to, deptCode, username, page, pageSize));
    }

    @GetMapping("/attendance/unlock-requests/pending-count")
    public ResponseEntity<Map<String, Long>> pendingUnlockRequestCount() {
        return ResponseEntity.ok(Map.of("count", unlockRequestService.countPending(authService.getAuthUser())));
    }

    @GetMapping("/attendance/unlock-requests")
    public ResponseEntity<List<UnlockRequestItemDto>> listUnlockRequests(
            @RequestParam(required = false) UnlockRequestStatus status) {
        return ResponseEntity.ok(unlockRequestService.list(authService.getAuthUser(), status));
    }

    @PostMapping("/attendance/unlock-requests/{id}/approve")
    public ResponseEntity<UnlockRequestItemDto> approveUnlockRequest(@PathVariable Long id) {
        return ResponseEntity.ok(unlockRequestService.approve(authService.getAuthUser(), id));
    }

    @PostMapping("/attendance/unlock-requests/{id}/reject")
    public ResponseEntity<UnlockRequestItemDto> rejectUnlockRequest(
            @PathVariable Long id,
            @RequestBody(required = false) UnlockRequestRejectRequest request) {
        String note = request != null ? request.getNote() : null;
        return ResponseEntity.ok(unlockRequestService.reject(authService.getAuthUser(), id, note));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/department-groups/next-code")
    public ResponseEntity<NextCodeDto> getNextGroupCode() {
        return ResponseEntity.ok(adminService.getNextGroupCode(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/department-groups")
    public ResponseEntity<List<AdminDepartmentGroupDto>> listDepartmentGroups() {
        return ResponseEntity.ok(adminService.listDepartmentGroups(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/department-groups")
    public ResponseEntity<AdminDepartmentGroupDto> createDepartmentGroup(
            @Valid @RequestBody DepartmentGroupUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createDepartmentGroup(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/department-groups/{groupCode}")
    public ResponseEntity<AdminDepartmentGroupDto> updateDepartmentGroup(
            @PathVariable Integer groupCode,
            @Valid @RequestBody DepartmentGroupUpsertRequest request) {
        return ResponseEntity.ok(
                adminService.updateDepartmentGroup(authService.getAuthUser(), groupCode, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/department-groups/{groupCode}")
    public ResponseEntity<Map<String, String>> deleteDepartmentGroup(@PathVariable Integer groupCode) {
        adminService.deleteDepartmentGroup(authService.getAuthUser(), groupCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa nhóm Đơn vị"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/departments/next-code")
    public ResponseEntity<NextCodeDto> getNextDeptCode() {
        return ResponseEntity.ok(adminService.getNextDeptCode(authService.getAuthUser()));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<AdminDepartmentDto>> listDepartments(
            @RequestParam(required = false) Integer groupCode) {
        return ResponseEntity.ok(adminService.listDepartments(authService.getAuthUser(), groupCode));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/departments/{deptCode}")
    public ResponseEntity<AdminDepartmentDto> getDepartment(@PathVariable Integer deptCode) {
        return ResponseEntity.ok(adminService.getDepartment(authService.getAuthUser(), deptCode));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/departments")
    public ResponseEntity<AdminDepartmentDto> createDepartment(@Valid @RequestBody DepartmentUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createDepartment(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/departments/{deptCode}")
    public ResponseEntity<AdminDepartmentDto> updateDepartment(
            @PathVariable Integer deptCode,
            @Valid @RequestBody DepartmentUpsertRequest request) {
        return ResponseEntity.ok(adminService.updateDepartment(authService.getAuthUser(), deptCode, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/departments/{deptCode}")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable Integer deptCode) {
        adminService.deleteDepartment(authService.getAuthUser(), deptCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa Đơn vị"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/staff/next-code")
    public ResponseEntity<NextCodeDto> getNextEmpCode(@RequestParam Integer deptCode) {
        return ResponseEntity.ok(adminService.getNextEmpCode(authService.getAuthUser(), deptCode));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/staff")
    public ResponseEntity<RegistryPageDto<AdminStaffDto>> listStaff(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer deptCode,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(
                adminService.listStaffPage(authService.getAuthUser(), search, deptCode, active, page, pageSize));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/staff/{empCode}")
    public ResponseEntity<AdminStaffDto> getStaff(@PathVariable Integer empCode) {
        return ResponseEntity.ok(adminService.getStaff(authService.getAuthUser(), empCode));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/staff/{empCode}/deactivate-preview")
    public ResponseEntity<StaffDeactivatePreviewDto> getStaffDeactivatePreview(@PathVariable Integer empCode) {
        return ResponseEntity.ok(adminService.getStaffDeactivatePreview(authService.getAuthUser(), empCode));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/staff/{empCode}/department-history")
    public ResponseEntity<List<StaffDepartmentAssignmentDto>> getStaffDepartmentHistory(
            @PathVariable Integer empCode) {
        return ResponseEntity.ok(adminService.listStaffDepartmentHistory(authService.getAuthUser(), empCode));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/staff/{empCode}/transfer")
    public ResponseEntity<AdminStaffDto> transferStaff(
            @PathVariable Integer empCode,
            @Valid @RequestBody StaffTransferRequest request) {
        return ResponseEntity.ok(
                adminService.transferStaff(authService.getAuthUser(), empCode, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/staff")
    public ResponseEntity<AdminStaffDto> createStaff(@Valid @RequestBody StaffUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createStaff(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/staff/{empCode}")
    public ResponseEntity<AdminStaffDto> updateStaff(
            @PathVariable Integer empCode,
            @Valid @RequestBody StaffUpsertRequest request) {
        return ResponseEntity.ok(adminService.updateStaff(authService.getAuthUser(), empCode, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/staff/{empCode}")
    public ResponseEntity<Map<String, String>> deleteStaff(@PathVariable Integer empCode) {
        String message = adminService.deleteStaff(authService.getAuthUser(), empCode);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/attendance-status-types")
    public ResponseEntity<List<AttendanceStatusTypeDto>> listAttendanceStatusTypes() {
        return ResponseEntity.ok(statusCatalogService.listAll(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/attendance-status-types/{id}")
    public ResponseEntity<AttendanceStatusTypeDto> getAttendanceStatusType(@PathVariable Long id) {
        return ResponseEntity.ok(statusCatalogService.getById(authService.getAuthUser(), id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/attendance-status-types")
    public ResponseEntity<AttendanceStatusTypeDto> createAttendanceStatusType(
            @Valid @RequestBody AttendanceStatusTypeUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(statusCatalogService.create(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/attendance-status-types/{id}")
    public ResponseEntity<AttendanceStatusTypeDto> updateAttendanceStatusType(
            @PathVariable Long id,
            @Valid @RequestBody AttendanceStatusTypeUpsertRequest request) {
        return ResponseEntity.ok(statusCatalogService.update(authService.getAuthUser(), id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/attendance-status-types/{id}")
    public ResponseEntity<Map<String, String>> deleteAttendanceStatusType(@PathVariable Long id) {
        statusCatalogService.delete(authService.getAuthUser(), id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa trạng thái"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/staff-ranks/next-code")
    public ResponseEntity<NextCodeDto> getNextStaffRankCode() {
        return ResponseEntity.ok(staffRankCatalogService.getNextCode(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/staff-ranks")
    public ResponseEntity<List<StaffRankDto>> listStaffRanks() {
        return ResponseEntity.ok(staffRankCatalogService.listAll(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/staff-ranks")
    public ResponseEntity<StaffRankDto> createStaffRank(@Valid @RequestBody StaffRankUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffRankCatalogService.create(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/staff-ranks/{rankCode}")
    public ResponseEntity<StaffRankDto> updateStaffRank(
            @PathVariable Integer rankCode,
            @Valid @RequestBody StaffRankUpsertRequest request) {
        return ResponseEntity.ok(
                staffRankCatalogService.update(authService.getAuthUser(), rankCode, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/staff-ranks/{rankCode}")
    public ResponseEntity<Map<String, String>> deleteStaffRank(@PathVariable Integer rankCode) {
        staffRankCatalogService.delete(authService.getAuthUser(), rankCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa cấp bậc"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/staff-positions/next-code")
    public ResponseEntity<NextCodeDto> getNextStaffPositionCode() {
        return ResponseEntity.ok(staffPositionCatalogService.getNextCode(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/staff-positions")
    public ResponseEntity<List<StaffPositionDto>> listStaffPositions() {
        return ResponseEntity.ok(staffPositionCatalogService.listAll(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/staff-positions")
    public ResponseEntity<StaffPositionDto> createStaffPosition(
            @Valid @RequestBody StaffPositionUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffPositionCatalogService.create(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/staff-positions/{positionCode}")
    public ResponseEntity<StaffPositionDto> updateStaffPosition(
            @PathVariable Integer positionCode,
            @Valid @RequestBody StaffPositionUpsertRequest request) {
        return ResponseEntity.ok(
                staffPositionCatalogService.update(authService.getAuthUser(), positionCode, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/staff-positions/{positionCode}")
    public ResponseEntity<Map<String, String>> deleteStaffPosition(@PathVariable Integer positionCode) {
        staffPositionCatalogService.delete(authService.getAuthUser(), positionCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa chức vụ"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/settings/branding")
    public ResponseEntity<BrandingDto> getBranding() {
        return ResponseEntity.ok(settingsService.getBranding());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/settings/branding")
    public ResponseEntity<BrandingDto> updateBranding(@Valid @RequestBody BrandingUpdateRequest request) {
        return ResponseEntity.ok(settingsService.updateBranding(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/accounts/stats")
    public ResponseEntity<AccountStatsDto> getAccountStats() {
        return ResponseEntity.ok(adminAccountService.getAccountStats(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
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

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/accounts")
    public ResponseEntity<AdminAccountDto> createAccount(@Valid @RequestBody AccountUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminAccountService.createAccount(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/accounts/{accountId}")
    public ResponseEntity<AdminAccountDto> updateAccount(
            @PathVariable Long accountId,
            @Valid @RequestBody AccountUpsertRequest request) {
        return ResponseEntity.ok(adminAccountService.updateAccount(authService.getAuthUser(), accountId, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/accounts/{accountId}")
    public ResponseEntity<Map<String, String>> deleteAccount(@PathVariable Long accountId) {
        adminAccountService.deleteAccount(authService.getAuthUser(), accountId);
        return ResponseEntity.ok(Map.of("message", "Đã chuyển tài khoản sang ngưng hoạt động"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/accounts/{accountId}/reset-password")
    public ResponseEntity<Map<String, String>> resetAccountPassword(
            @PathVariable Long accountId,
            @Valid @RequestBody ResetPasswordRequest request) {
        adminAccountService.resetPassword(authService.getAuthUser(), accountId, request);
        return ResponseEntity.ok(Map.of("message", "Đã đặt lại mật khẩu thành công"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/screens")
    public ResponseEntity<List<ScreenCatalogItemDto>> listScreens() {
        return ResponseEntity.ok(accountScreenService.listCatalog(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/accounts/{accountId}/screens")
    public ResponseEntity<AccountScreensDto> getAccountScreens(@PathVariable Long accountId) {
        return ResponseEntity.ok(accountScreenService.getAccountScreens(authService.getAuthUser(), accountId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/accounts/{accountId}/screens")
    public ResponseEntity<AccountScreensDto> updateAccountScreens(
            @PathVariable Long accountId,
            @Valid @RequestBody AccountScreensUpdateRequest request) {
        return ResponseEntity.ok(
                accountScreenService.replaceAccountScreens(authService.getAuthUser(), accountId, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/permission-groups")
    public ResponseEntity<List<PermissionGroupDto>> listPermissionGroups(
            @RequestParam(required = false) String role,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(
                permissionGroupService.list(authService.getAuthUser(), role, activeOnly));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/permission-groups/{id}")
    public ResponseEntity<PermissionGroupDto> getPermissionGroup(@PathVariable Long id) {
        return ResponseEntity.ok(permissionGroupService.get(authService.getAuthUser(), id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/permission-groups")
    public ResponseEntity<PermissionGroupDto> createPermissionGroup(
            @Valid @RequestBody PermissionGroupUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(permissionGroupService.create(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/permission-groups/{id}")
    public ResponseEntity<PermissionGroupDto> updatePermissionGroup(
            @PathVariable Long id,
            @Valid @RequestBody PermissionGroupUpsertRequest request) {
        return ResponseEntity.ok(
                permissionGroupService.update(authService.getAuthUser(), id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/permission-groups/{id}")
    public ResponseEntity<Map<String, String>> deactivatePermissionGroup(@PathVariable Long id) {
        permissionGroupService.deactivate(authService.getAuthUser(), id);
        return ResponseEntity.ok(Map.of("message", "Đã ngưng nhóm quyền"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/fingerprints")
    public ResponseEntity<List<FingerprintStatusDto>> listFingerprints(
            @RequestParam(required = false) Integer deptCode) {
        return ResponseEntity.ok(fingerprintService.listStatusForAdmin(authService.getAuthUser(), deptCode));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/fingerprints/{empCode}")
    public ResponseEntity<Map<String, String>> deleteFingerprint(@PathVariable Integer empCode) {
        fingerprintService.deleteForAdmin(authService.getAuthUser(), empCode);
        return ResponseEntity.ok(Map.of("message", "Đã xóa đăng ký vân tay thành công"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/fingerprints/enroll")
    public ResponseEntity<FingerprintStatusDto> enrollFingerprint(
            @Valid @RequestBody FingerprintEnrollRequest request) {
        return ResponseEntity.ok(
                fingerprintService.enrollFromAdmin(authService.getAuthUser(), request));
    }

    @GetMapping("/fingerprints/audit-logs")
    public ResponseEntity<FingerprintTemplateAuditLogPageDto> listFingerprintAuditLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer deptCode,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(templateAuditService.listForAdmin(
                authService.getAuthUser(), from, to, deptCode, page, pageSize));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/fingerprint/kiosk-tokens")
    public ResponseEntity<List<KioskTokenDto>> listKioskTokens() {
        return ResponseEntity.ok(fingerprintService.listKioskTokensForAdmin(authService.getAuthUser()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/fingerprint/kiosk-tokens")
    public ResponseEntity<KioskTokenIssuedDto> createKioskToken(
            @Valid @RequestBody KioskTokenCreateRequest request) {
        return ResponseEntity.ok(
                fingerprintService.createKioskTokenForAdmin(authService.getAuthUser(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/fingerprint/kiosk-tokens/{id}/label")
    public ResponseEntity<KioskTokenDto> updateKioskTokenLabel(
            @PathVariable Long id,
            @Valid @RequestBody KioskTokenUpdateLabelRequest request) {
        return ResponseEntity.ok(
                fingerprintService.updateKioskLabelForAdmin(authService.getAuthUser(), id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/fingerprint/kiosk-tokens/{id}/revoke")
    public ResponseEntity<Map<String, String>> revokeKioskToken(@PathVariable Long id) {
        fingerprintService.revokeKioskTokenForAdmin(authService.getAuthUser(), id);
        return ResponseEntity.ok(Map.of("message", "Đã thu hồi token kiosk"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/fingerprint/kiosk-tokens/{id}/rotate")
    public ResponseEntity<KioskTokenIssuedDto> rotateKioskToken(@PathVariable Long id) {
        return ResponseEntity.ok(
                fingerprintService.rotateKioskTokenForAdmin(authService.getAuthUser(), id));
    }
}
