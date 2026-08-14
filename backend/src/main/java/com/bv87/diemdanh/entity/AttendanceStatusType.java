package com.bv87.diemdanh.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "attendance_status_types")
@Getter
@Setter
@NoArgsConstructor
public class AttendanceStatusType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @Column(name = "badge_label", nullable = false, length = 100)
    private String badgeLabel;

    @Column(name = "color_key", nullable = false, length = 20)
    private String colorKey;

    @Column(name = "icon_key", nullable = false, length = 30)
    private String iconKey;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** Flyway V3 TINYINT(1); columnDefinition required for ddl-auto: validate on prod. */
    @Column(name = "active", nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 1")
    private boolean active = true;

    /** Flyway V17 TINYINT(1); must not map to BIT under Hibernate validate. */
    @Column(name = "manual_allowed", nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean manualAllowed = false;

    /** Flyway V17 TINYINT(1); must not map to BIT under Hibernate validate. */
    @Column(name = "group_parent", nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean groupParent = false;

    @Column(name = "parent_code", length = 50)
    private String parentCode;
}
