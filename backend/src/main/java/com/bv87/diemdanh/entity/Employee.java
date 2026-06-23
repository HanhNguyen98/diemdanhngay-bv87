package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
public class Employee {

    @Id
    @Column(name = "emp_code", nullable = false)
    private Integer empCode;

    @Column(name = "fullname", nullable = false, length = 100)
    private String fullname;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_code", nullable = false)
    private Department department;

    @Column(name = "rank_name", length = 100)
    private String rankName;

    @Column(name = "position_name", length = 150)
    private String positionName;

    @Column(name = "is_active", nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 1")
    private boolean active = true;

    @Lob
    @Column(name = "avatar_url", columnDefinition = "MEDIUMTEXT")
    private String avatarUrl;
}
