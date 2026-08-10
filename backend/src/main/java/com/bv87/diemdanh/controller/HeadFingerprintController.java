package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.FingerprintStatusDto;
import com.bv87.diemdanh.service.AuthService;
import com.bv87.diemdanh.service.FingerprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * HEAD fingerprint status (read-only). Template enroll/delete is Agent-only (SPEC P2.3).
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
}
