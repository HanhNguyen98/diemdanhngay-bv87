package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

/** One merged manual-status period — SPEC §3.2.2. */
@Getter
@Builder
public class ManualSchedulePeriodDto {
    private final LocalDate fromDate;
    private final LocalDate toDate;
    private final int dayCount;
    private final String status;
    private final String statusLabel;
}
