package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StaffPositionDto {
    private final Integer positionCode;
    private final String positionCodeFormatted;
    private final String positionName;
    private final int sortOrder;
    private final boolean active;
    private final long usageCount;
}
