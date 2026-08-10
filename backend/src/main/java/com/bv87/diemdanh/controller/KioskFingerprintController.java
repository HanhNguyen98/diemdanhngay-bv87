package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.FingerprintEnrollRequest;
import com.bv87.diemdanh.dto.FingerprintScanRequest;
import com.bv87.diemdanh.dto.FingerprintScanResultDto;
import com.bv87.diemdanh.dto.FingerprintStatusDto;
import com.bv87.diemdanh.dto.KioskStaffDto;
import com.bv87.diemdanh.dto.KioskTemplateDto;
import com.bv87.diemdanh.security.KioskAuthentication;
import com.bv87.diemdanh.service.FingerprintScanService;
import com.bv87.diemdanh.service.FingerprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Kiosk Agent API — authenticated via {@code X-Kiosk-Token} (LAN department PC).
 */
@RestController
@RequestMapping("/api/kiosk")
@RequiredArgsConstructor
public class KioskFingerprintController {

    private final FingerprintService fingerprintService;
    private final FingerprintScanService fingerprintScanService;

    @GetMapping("/staff")
    public ResponseEntity<List<KioskStaffDto>> listStaff(Authentication authentication) {
        return ResponseEntity.ok(fingerprintService.listStaffForKiosk(requireKiosk(authentication)));
    }

    @PostMapping("/fingerprints/enroll")
    public ResponseEntity<FingerprintStatusDto> enroll(
            Authentication authentication,
            @Valid @RequestBody FingerprintEnrollRequest request) {
        return ResponseEntity.ok(fingerprintService.enrollFromKiosk(requireKiosk(authentication), request));
    }

    @DeleteMapping("/fingerprints/{empCode}")
    public ResponseEntity<Void> delete(
            Authentication authentication,
            @PathVariable Integer empCode) {
        fingerprintService.deleteForKiosk(requireKiosk(authentication), empCode);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/fingerprints/templates")
    public ResponseEntity<List<KioskTemplateDto>> listTemplates(Authentication authentication) {
        return ResponseEntity.ok(fingerprintScanService.listTemplatesForKiosk(requireKiosk(authentication)));
    }

    @PostMapping("/fingerprints/scan")
    public ResponseEntity<FingerprintScanResultDto> scan(
            Authentication authentication,
            @Valid @RequestBody FingerprintScanRequest request) {
        return ResponseEntity.ok(fingerprintScanService.processScan(requireKiosk(authentication), request));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health(Authentication authentication) {
        return ResponseEntity.ok(fingerprintService.healthForKiosk(requireKiosk(authentication)));
    }

    /** P4 §9.5.2 — Agent periodic Online signal. */
    @PostMapping("/heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat(Authentication authentication) {
        fingerprintService.recordHeartbeat(requireKiosk(authentication));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private static KioskAuthentication requireKiosk(Authentication authentication) {
        if (!(authentication instanceof KioskAuthentication kiosk)) {
            throw new IllegalStateException("Kiosk authentication required");
        }
        return kiosk;
    }
}
