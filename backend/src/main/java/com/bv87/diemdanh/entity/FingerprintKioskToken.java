package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Kiosk Agent authentication token bound to one department.
 */
@Entity
@Table(name = "fingerprint_kiosk_tokens")
@Getter
@Setter
@NoArgsConstructor
public class FingerprintKioskToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dept_code", nullable = false)
    private Integer deptCode;

    @Column(name = "token_hash", nullable = false, length = 64, unique = true)
    private String tokenHash;

    /** Plaintext for Admin re-view/copy while active; cleared on revoke (SPEC P1.2c). */
    @Column(name = "token_plaintext", length = 128)
    private String tokenPlaintext;

    /** Enroll-mode PIN for Agent (SPEC P2.1e); cleared on revoke; kept on rotate. */
    @Column(name = "enroll_pin", length = 16)
    private String enrollPin;

    @Column(name = "label", length = 100)
    private String label;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /** Last successful Agent heartbeat (SPEC §9.5.2 P4). */
    @Column(name = "last_heartbeat_at")
    private Instant lastHeartbeatAt;
}
