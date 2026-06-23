package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDepartmentGroupDto {
    private final Integer groupCode;
    private final String groupCodeFormatted;
    private final String groupName;
    private final int sortOrder;
    private final long deptCount;
    private final boolean active;
}
