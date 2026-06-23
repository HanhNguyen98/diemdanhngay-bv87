package com.bv87.diemdanh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Admin catalog grouping for departments; not used in attendance workflow. */
@Entity
@Table(name = "department_groups")
@Getter
@Setter
@NoArgsConstructor
public class DepartmentGroup {

    @Id
    @Column(name = "group_code", nullable = false)
    private Integer groupCode;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
