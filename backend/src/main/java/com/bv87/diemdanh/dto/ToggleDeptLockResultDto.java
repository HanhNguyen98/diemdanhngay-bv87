package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ToggleDeptLockResultDto {
    private final boolean locked;
    private final boolean manualLocked;
    private final boolean unlocked;
    private final String message;
}
