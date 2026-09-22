package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AccountScreensDto {
    private final Long accountId;
    private final String role;
    private final boolean usingDefaults;
    private final Long permissionGroupId;
    private final String permissionGroupName;
    private final List<String> screenCodes;
    private final List<String> allowedCodes;
}
