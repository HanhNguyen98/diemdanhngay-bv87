package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_unlocks")
@Getter
@Setter
@NoArgsConstructor
public class AttendanceUnlock {

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

    @Column(name = "unlocked_at", nullable = false)
    private LocalDateTime unlockedAt;

    @PrePersist
    void prePersist() {
        if (unlockedAt == null) {
            unlockedAt = LocalDateTime.now();
        }
    }

    public Integer getDeptCode() {
        return department != null ? department.getDeptCode() : null;
    }
}
