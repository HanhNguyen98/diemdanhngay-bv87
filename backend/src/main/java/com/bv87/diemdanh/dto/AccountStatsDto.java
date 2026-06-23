package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountStatsDto {
    private final long total;
    private final long active;
    private final long inactive;
}
