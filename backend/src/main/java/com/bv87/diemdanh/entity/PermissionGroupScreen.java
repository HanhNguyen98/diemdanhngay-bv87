package com.bv87.diemdanh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/** Screen membership of a permission group — SPEC_DUTY §7.1. */
@Entity
@Table(
        name = "permission_group_screens",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_pgs_group_code",
                columnNames = {"group_id", "screen_code"}))
@Getter
@Setter
public class PermissionGroupScreen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private PermissionGroup group;

    @Column(name = "screen_code", nullable = false, length = 80)
    private String screenCode;
}
