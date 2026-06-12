package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AttendancePageDto {
    private final AttendanceSummaryDto summary;
    private final List<StaffAttendanceDto> staff;
}
