package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/** Tracks employee department assignment history for transfers and audit. */
@Entity
@Table(name = "employee_department_assignments")
@Getter
@Setter
@NoArgsConstructor
public class EmployeeDepartmentAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emp_code", nullable = false)
    private Integer empCode;

    @Column(name = "dept_code", nullable = false)
    private Integer deptCode;

    @Column(name = "from_date", nullable = false)
    private LocalDate fromDate;

    @Column(name = "to_date")
    private LocalDate toDate;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
    private Instant createdAt = Instant.now();
}
