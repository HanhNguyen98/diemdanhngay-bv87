package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Kiosk Identify scan payload (P2.1 / P4b).
 */
@Getter
@Setter
public class FingerprintScanRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    private Integer score;

    /**
     * Deprecated for Rule C — server always uses {@code Instant.now()} (SPEC §8.2 P4b).
     * Kept for API compatibility; value is ignored.
     */
    private String scannedAt;
}
