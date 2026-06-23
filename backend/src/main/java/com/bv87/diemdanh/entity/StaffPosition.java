package com.bv87.diemdanh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Admin catalog of job positions for staff profiles. */
@Entity
@Table(name = "staff_positions")
@Getter
@Setter
@NoArgsConstructor
public class StaffPosition {

    @Id
    @Column(name = "position_code", nullable = false)
    private Integer positionCode;

    @Column(name = "position_name", nullable = false, length = 150, unique = true)
    private String positionName;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
