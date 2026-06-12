package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDepartmentDto {
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final String location;
    private final String locationImageUrl;
    private final Integer headEmpCode;
    private final String headEmpCodeFormatted;
    private final String headName;
    private final String headRank;
    private final long staffCount;
}
