package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.service.AttendanceService;
import com.bv87.diemdanh.service.AttendanceStatisticsService;
import com.bv87.diemdanh.service.AuthService;
import com.bv87.diemdanh.util.VietnamTimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final AttendanceStatisticsService statisticsService;
    private final AuthService authService;
    private final VietnamTimeService timeService;

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDto>> getDepartments() {
        return ResponseEntity.ok(attendanceService.getAllDepartments(authService.getAuthUser()));
    }

    @GetMapping("/session/status")
    public ResponseEntity<SessionStatusDto> getSessionStatus() {
        return ResponseEntity.ok(attendanceService.getSessionStatus(authService.getAuthUser()));
    }

    @GetMapping("/attendance/summary")
    public ResponseEntity<AttendanceSummaryDto> getSummary(
            @RequestParam(required = false) Integer deptCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : timeService.today();
        return ResponseEntity.ok(attendanceService.getSummary(authService.getAuthUser(), deptCode, targetDate));
    }

    @GetMapping("/attendance/summaries")
    public ResponseEntity<List<AttendanceSummaryDto>> getAllSummaries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : timeService.today();
        return ResponseEntity.ok(attendanceService.getAllSummaries(authService.getAuthUser(), targetDate));
    }

    @GetMapping("/attendance/staff")
    public ResponseEntity<List<StaffAttendanceDto>> getStaffList(
            @RequestParam(required = false) Integer deptCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : timeService.today();
        return ResponseEntity.ok(attendanceService.getStaffList(authService.getAuthUser(), deptCode, targetDate));
    }

    @GetMapping("/attendance/page")
    public ResponseEntity<AttendancePageDto> getAttendancePage(
            @RequestParam(required = false) Integer deptCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : timeService.today();
        return ResponseEntity.ok(attendanceService.getAttendancePage(authService.getAuthUser(), deptCode, targetDate));
    }

    @GetMapping("/attendance/statistics")
    public ResponseEntity<AttendanceStatisticsDto> getStatistics(
            @RequestParam(required = false) Integer deptCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(statisticsService.getStatistics(
                authService.getAuthUser(), deptCode, from, to, search));
    }

    @GetMapping("/attendance/statistics/history")
    public ResponseEntity<AttendanceHistoryPageDto> getStatisticsHistory(
            @RequestParam(required = false) Integer deptCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(statisticsService.getHistoryPage(
                authService.getAuthUser(), deptCode, from, to, search, page, pageSize));
    }

    @GetMapping("/attendance/statistics/history/export")
    public ResponseEntity<List<AttendanceHistoryItemDto>> exportStatisticsHistory(
            @RequestParam(required = false) Integer deptCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(statisticsService.getHistoryForExport(
                authService.getAuthUser(), deptCode, from, to, search));
    }

    @PostMapping("/attendance")
    public ResponseEntity<StaffAttendanceDto> createAttendance(
            @Valid @RequestBody UpdateAttendanceRequest request,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : timeService.today();
        return ResponseEntity.ok(attendanceService.saveAttendance(authService.getAuthUser(), request, targetDate));
    }

    @PutMapping("/attendance")
    public ResponseEntity<StaffAttendanceDto> updateAttendance(
            @Valid @RequestBody UpdateAttendanceRequest request,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : timeService.today();
        return ResponseEntity.ok(attendanceService.saveAttendance(authService.getAuthUser(), request, targetDate));
    }

    @PostMapping("/attendance/unlock")
    public ResponseEntity<Map<String, String>> unlockDepartment(
            @Valid @RequestBody UnlockDepartmentRequest request) {
        attendanceService.unlockDepartment(authService.getAuthUser(), request);
        return ResponseEntity.ok(Map.of(
                "message",
                "Đã cấp quyền sửa đổi đặc cách cho Đơn vị "
                        + String.format("%02d", request.getDeptCode())
                        + " trong ngày hôm nay"
        ));
    }

    @PostMapping("/attendance/report-submit")
    public ResponseEntity<Map<String, String>> submitReport(
            @RequestParam(required = false) Integer deptCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : timeService.today();
        attendanceService.submitReport(authService.getAuthUser(), deptCode, targetDate);
        return ResponseEntity.ok(Map.of("message", "Đã gửi báo cáo thành công"));
    }
}
