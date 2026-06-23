package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Admin-initiated early lock for a department on a given attendance date. */
@Entity
@Table(name = "attendance_manual_locks")
@Getter
@Setter
@NoArgsConstructor
public class AttendanceManualLock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_code", nullable = false)
    private Department department;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @Column(name = "locked_by", nullable = false)
    private Long lockedBy;

    @Column(name = "locked_at", nullable = false)
    private LocalDateTime lockedAt;

    @PrePersist
    void prePersist() {
        if (lockedAt == null) {
            lockedAt = LocalDateTime.now();
        }
    }

    public Integer getDeptCode() {
        return department != null ? department.getDeptCode() : null;
    }
}
