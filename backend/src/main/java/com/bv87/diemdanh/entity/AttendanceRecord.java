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

    @Column(name = "morning_in_at")
    private java.time.Instant morningInAt;

    @Column(name = "noon_out_at")
    private java.time.Instant noonOutAt;

    @Column(name = "afternoon_in_at")
    private java.time.Instant afternoonInAt;

    @Column(name = "afternoon_out_at")
    private java.time.Instant afternoonOutAt;

    @Column(name = "late_flag", nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean lateFlag;

    @Column(name = "last_kiosk_hostname", length = 120)
    private String lastKioskHostname;

    @Column(name = "last_kiosk_ip", length = 64)
    private String lastKioskIp;

    @Column(name = "last_kiosk_dept_code")
    private Integer lastKioskDeptCode;

    @Column(name = "last_kiosk_label", length = 120)
    private String lastKioskLabel;

    @Column(name = "source", length = 30)
    private String source;

    public Integer getEmpCode() {
        return employee != null ? employee.getEmpCode() : null;
    }
}
