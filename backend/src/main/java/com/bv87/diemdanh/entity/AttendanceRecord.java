package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "attendance_records")
@Getter
@Setter
@NoArgsConstructor
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emp_code", nullable = false)
    private Employee employee;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "check_in_at")
    private java.time.Instant checkInAt;

    @Column(name = "check_out_at")
    private java.time.Instant checkOutAt;

    @Column(name = "source", length = 30)
    private String source;

    public Integer getEmpCode() {
        return employee != null ? employee.getEmpCode() : null;
    }
}
