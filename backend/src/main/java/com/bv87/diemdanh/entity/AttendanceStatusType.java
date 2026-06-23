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

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
