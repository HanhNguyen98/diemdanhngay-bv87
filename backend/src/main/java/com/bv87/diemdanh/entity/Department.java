package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
public class Department {

    @Id
    @Column(name = "dept_code", nullable = false)
    private Integer deptCode;

    @Column(name = "dept_name", nullable = false, length = 100)
    private String deptName;

    @Column(name = "unit_code", length = 20)
    private String unitCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_code", nullable = false)
    private DepartmentGroup departmentGroup;

    @Column(name = "location", length = 150)
    private String location;

    @Column(name = "head_emp_code")
    private Integer headEmpCode;

    @Lob
    @Column(name = "location_image_url", columnDefinition = "MEDIUMTEXT")
    private String locationImageUrl;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
