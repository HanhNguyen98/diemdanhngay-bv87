package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/**
 * Kiosk token metadata for Admin list.
 * Includes plaintext when active and stored (SPEC P1.2c Option A); never includes hash.
 */
@Getter
@Builder
public class KioskTokenDto {
    private final Long id;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final String label;
    /** Plaintext when active; null when revoked or legacy row without stored plaintext. */
    private final String token;
    /** Enroll PIN when active and set; null otherwise (SPEC P2.1e). */
    private final String enrollPin;
    private final boolean active;
    private final Instant createdAt;
    /** Last Agent heartbeat; null if never. */
    private final Instant lastHeartbeatAt;
    /** True when active and heartbeat within online threshold (SPEC §9.5.2). */
    private final boolean agentOnline;
}
