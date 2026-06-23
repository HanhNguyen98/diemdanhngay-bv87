package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDepartmentDto {
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final Integer groupCode;
    private final String groupCodeFormatted;
    private final String groupName;
    private final String deptName;
    /** Dept name for UI — if unitCode exists, remove trailing "(unitCode)" suffix from deptName. */
    private final String deptNameDisplay;
    private final String unitCode;
    private final String location;
    private final String locationImageUrl;
    private final Integer headEmpCode;
    private final String headEmpCodeFormatted;
    private final String headName;
    private final String headRank;
    private final long staffCount;
    private final boolean active;
}
