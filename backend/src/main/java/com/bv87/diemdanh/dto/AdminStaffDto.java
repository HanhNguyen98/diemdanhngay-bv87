package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminStaffDto {
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final String rankName;
    private final String positionName;
    private final boolean active;
    private final String avatarUrl;
    private final boolean hasActiveHeadAccount;
    private final boolean isDepartmentCatalogHead;
    private final String headAccountUsername;
}
