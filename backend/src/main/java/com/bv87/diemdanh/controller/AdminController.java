package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AdminAccountService adminAccountService;
    private final SettingsService settingsService;
    private final AuthService authService;
    private final AdminDashboardService adminDashboardService;
    private final AttendanceReminderService attendanceReminderService;
    private final AttendanceReportService attendanceReportService;

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

    @GetMapping("/departments/next-code")
    public ResponseEntity<NextCodeDto> getNextDeptCode() {
        return ResponseEntity.ok(adminService.getNextDeptCode(authService.getAuthUser()));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<AdminDepartmentDto>> listDepartments() {
        return ResponseEntity.ok(adminService.listDepartments(authService.getAuthUser()));
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
    public ResponseEntity<List<AdminStaffDto>> listStaff(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer deptCode) {
        return ResponseEntity.ok(adminService.listStaff(authService.getAuthUser(), search, deptCode));
    }

    @GetMapping("/staff/{empCode}")
    public ResponseEntity<AdminStaffDto> getStaff(@PathVariable Integer empCode) {
        return ResponseEntity.ok(adminService.getStaff(authService.getAuthUser(), empCode));
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

    @GetMapping("/settings/branding")
    public ResponseEntity<BrandingDto> getBranding() {
        return ResponseEntity.ok(settingsService.getBranding());
    }

    @PutMapping("/settings/branding")
    public ResponseEntity<BrandingDto> updateBranding(@Valid @RequestBody BrandingUpdateRequest request) {
        return ResponseEntity.ok(settingsService.updateBranding(authService.getAuthUser(), request));
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<AdminAccountDto>> listAccounts() {
        return ResponseEntity.ok(adminAccountService.listAccounts(authService.getAuthUser()));
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
