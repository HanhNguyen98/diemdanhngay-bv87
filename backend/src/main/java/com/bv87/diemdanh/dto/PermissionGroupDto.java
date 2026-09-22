package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PermissionGroupDto {
    private final Long id;
    private final String name;
    private final String roleScope;
    private final String roleScopeLabel;
    private final boolean active;
    private final List<String> screenCodes;
    private final long accountCount;
}
