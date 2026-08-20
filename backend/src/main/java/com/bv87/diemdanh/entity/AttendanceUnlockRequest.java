package com.bv87.diemdanh.entity;

import com.bv87.diemdanh.enums.UnlockRequestStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** HEAD request for Admin to unlock a department date — SPEC P15. */
@Entity
@Table(name = "attendance_unlock_requests")
@Getter
@Setter
@NoArgsConstructor
public class AttendanceUnlockRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_code", nullable = false)
    private Department department;

    @Column(nullable = false, length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnlockRequestStatus status = UnlockRequestStatus.PENDING;

    @Column(name = "requested_by", nullable = false, length = 50)
    private String requestedBy;

    @Column(name = "requested_by_account_id", nullable = false)
    private Long requestedByAccountId;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "reviewed_by", length = 50)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_note", length = 255)
    private String reviewNote;

    public Integer getDeptCode() {
        return department != null ? department.getDeptCode() : null;
    }
}
