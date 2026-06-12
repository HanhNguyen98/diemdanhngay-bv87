package com.bv87.diemdanh.dto.ai;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LeaveAnalyticsRowDto {
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final long leaveCount;
}
