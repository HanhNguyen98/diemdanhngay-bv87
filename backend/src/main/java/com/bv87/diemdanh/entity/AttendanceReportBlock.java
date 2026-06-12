package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_report_blocks")
@Getter
@Setter
@NoArgsConstructor
public class AttendanceReportBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "dept_code", nullable = false)
    private Integer deptCode;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "blocked_by", nullable = false)
    private Long blockedBy;

    @Column(name = "blocked_at", nullable = false)
    private LocalDateTime blockedAt = LocalDateTime.now();
}
