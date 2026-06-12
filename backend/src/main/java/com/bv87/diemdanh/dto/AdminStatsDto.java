package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminStatsDto {
    private final int totalDepartments;
    private final int totalStaff;
    private final int activeStaff;
    private final double activePercent;
    private final int newDepartmentsThisMonth;
}
