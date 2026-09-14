package com.bv87.diemdanh.entity;

import com.bv87.diemdanh.enums.FingerprintTemplateAuditAction;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Append-only audit log for fingerprint template enroll/delete — SPEC P-HeadFpReset. */
@Entity
@Table(name = "fingerprint_template_audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class FingerprintTemplateAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private FingerprintTemplateAuditAction action;

    @Column(name = "emp_code", nullable = false)
    private Integer empCode;

    @Column(name = "dept_code", nullable = false)
    private Integer deptCode;

    @Column(name = "emp_fullname", length = 200)
    private String empFullname;

    @Column(name = "actor_username", length = 80)
    private String actorUsername;

    @Column(name = "actor_role", nullable = false, length = 20)
    private String actorRole;

    @Column(name = "kiosk_label", length = 100)
    private String kioskLabel;

    @Column(name = "finger_label", length = 100)
    private String fingerLabel;

    @Column(name = "client_ip", length = 64)
    private String clientIp;

    @Column(length = 255)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
