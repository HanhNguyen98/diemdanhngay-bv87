package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReminderDeptStatDto {
    private final Integer deptCode;
    private final String deptName;
    private final int sentCount;
}
