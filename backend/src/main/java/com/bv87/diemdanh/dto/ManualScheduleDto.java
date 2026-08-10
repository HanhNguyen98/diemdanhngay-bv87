package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/** Manual leave/study/trip schedule for one employee — SPEC §3.2.2. */
@Getter
@Builder
public class ManualScheduleDto {
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final LocalDate from;
    private final LocalDate to;
    private final List<ManualSchedulePeriodDto> items;
}
