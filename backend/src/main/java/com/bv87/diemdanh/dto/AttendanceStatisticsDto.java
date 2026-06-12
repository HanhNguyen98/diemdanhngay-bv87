package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class AttendanceStatisticsDto {
    private final LocalDate from;
    private final LocalDate to;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final AttendanceStatisticsSummaryDto summary;
    private final List<AttendanceTrendPointDto> trend;
}
