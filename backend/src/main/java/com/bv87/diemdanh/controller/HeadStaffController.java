package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.AdminStaffDto;
import com.bv87.diemdanh.dto.AdminStatsDto;
import com.bv87.diemdanh.dto.StaffAvatarUpdateRequest;
import com.bv87.diemdanh.service.AdminService;
import com.bv87.diemdanh.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/head/staff")
@RequiredArgsConstructor
public class HeadStaffController {

    private final AdminService adminService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<AdminStaffDto>> listStaff(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(
                adminService.listStaffForHead(authService.getAuthUser(), search));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStaffStatsForHead(authService.getAuthUser()));
    }

    @PatchMapping("/{empCode}/avatar")
    public ResponseEntity<AdminStaffDto> updateAvatar(
            @PathVariable Integer empCode,
            @RequestBody StaffAvatarUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateStaffAvatarForHead(
                authService.getAuthUser(),
                empCode,
                request != null ? request.getAvatarUrl() : null));
    }
}
