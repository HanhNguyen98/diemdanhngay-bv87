package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AttendanceTrendPointDto {
    private final String label;
    private final List<StatusBreakdownItemDto> statusBreakdown;
}
