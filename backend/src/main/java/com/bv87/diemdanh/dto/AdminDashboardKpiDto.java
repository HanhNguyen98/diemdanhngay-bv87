package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AdminDashboardKpiDto {
    private final long total;
    private final List<StatusBreakdownItemDto> statusBreakdown;
    private final long unchecked;
}
