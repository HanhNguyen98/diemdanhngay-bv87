package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@Builder
public class SessionStatusDto {
    private final boolean editable;
    private final boolean locked;
    private final boolean beforeOpen;
    private final boolean afterLock;
    private final boolean unlocked;
    private final LocalTime openTime;
    private final LocalTime lockTime;
    private final String currentTimeVn;
    private final String message;
}
