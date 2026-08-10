package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Stored fingerprint template for an employee (enrolled via department kiosk Agent).
 */
@Entity
@Table(name = "employee_fingerprints")
@Getter
@Setter
@NoArgsConstructor
public class EmployeeFingerprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emp_code", nullable = false)
    private Integer empCode;

    @Column(name = "finger_index", nullable = false)
    private int fingerIndex = 0;

    @Lob
    @Column(name = "template_base64", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String templateBase64;

    @Column(name = "template_len", nullable = false)
    private int templateLen;

    @Column(name = "zk_fid")
    private Integer zkFid;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "enrolled_at", nullable = false)
    private Instant enrolledAt;

    @Column(name = "enrolled_by", length = 100)
    private String enrolledBy;

    /** Human note for which finger was enrolled (e.g. right thumb) — P2.2. */
    @Column(name = "finger_label", length = 100)
    private String fingerLabel;

    @Column(name = "source", nullable = false, length = 30)
    private String source = "KIOSK";
}
