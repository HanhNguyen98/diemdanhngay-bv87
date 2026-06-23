package com.bv87.diemdanh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Admin catalog of military ranks for staff profiles. */
@Entity
@Table(name = "staff_ranks")
@Getter
@Setter
@NoArgsConstructor
public class StaffRank {

    @Id
    @Column(name = "rank_code", nullable = false)
    private Integer rankCode;

    @Column(name = "rank_name", nullable = false, length = 100, unique = true)
    private String rankName;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
