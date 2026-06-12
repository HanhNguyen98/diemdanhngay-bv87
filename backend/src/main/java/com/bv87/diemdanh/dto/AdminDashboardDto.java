package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class AdminDashboardDto {
    private final LocalDate attendanceDate;
    private final AdminDashboardKpiDto kpi;
    private final List<AttendanceSummaryDto> departments;
}
