package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.FingerprintEnrollRequest;
import com.bv87.diemdanh.dto.FingerprintStatusDto;
import com.bv87.diemdanh.service.AuthService;
import com.bv87.diemdanh.service.FingerprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * HEAD fingerprint management — enroll/delete for own department (D1.1 / P2.4).
 */
@RestController
@RequestMapping("/api/head/fingerprints")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HEAD')")
public class HeadFingerprintController {

    private final FingerprintService fingerprintService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<FingerprintStatusDto>> list() {
        return ResponseEntity.ok(fingerprintService.listStatusForHead(authService.getAuthUser()));
    }

    @DeleteMapping("/{empCode}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Integer empCode) {
        fingerprintService.deleteForHead(authService.getAuthUser(), empCode);
        return ResponseEntity.ok(Map.of(
                "message", "Đã xóa đăng ký vân tay. Nhân viên có thể đăng ký lại trong màn Đăng ký vân tay."));
    }

    @PostMapping("/enroll")
    public ResponseEntity<FingerprintStatusDto> enroll(@Valid @RequestBody FingerprintEnrollRequest request) {
        return ResponseEntity.ok(
                fingerprintService.enrollFromHead(authService.getAuthUser(), request));
    }
}
