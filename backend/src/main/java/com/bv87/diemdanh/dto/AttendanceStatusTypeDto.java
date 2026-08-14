package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendanceStatusTypeDto {
    private final Long id;
    private final String code;
    private final String label;
    private final String badgeLabel;
    private final String colorKey;
    private final String iconKey;
    private final int sortOrder;
    private final boolean active;
    private final boolean manualAllowed;
    private final boolean groupParent;
    private final String parentCode;
    private final long usageCount;
}
