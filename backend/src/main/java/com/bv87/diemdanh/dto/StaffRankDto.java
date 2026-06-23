package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StaffRankDto {
    private final Integer rankCode;
    private final String rankCodeFormatted;
    private final String rankName;
    private final int sortOrder;
    private final boolean active;
    private final long usageCount;
}
