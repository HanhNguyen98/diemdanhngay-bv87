package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Append-only fingerprint scan attempt (IN / OUT / REJECTED).
 */
@Entity
@Table(name = "fingerprint_scan_logs")
@Getter
@Setter
@NoArgsConstructor
public class FingerprintScanLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emp_code", nullable = false)
    private Integer empCode;

    @Column(name = "dept_code", nullable = false)
    private Integer deptCode;

    @Column(name = "scanned_at", nullable = false)
    private Instant scannedAt;

    @Column(name = "direction", nullable = false, length = 20)
    private String direction;

    @Column(name = "score")
    private Integer score;

    @Column(name = "message", length = 255)
    private String message;

    @Column(name = "client_hostname", length = 120)
    private String clientHostname;

    @Column(name = "client_ip", length = 64)
    private String clientIp;

    @Column(name = "kiosk_label", length = 120)
    private String kioskLabel;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
