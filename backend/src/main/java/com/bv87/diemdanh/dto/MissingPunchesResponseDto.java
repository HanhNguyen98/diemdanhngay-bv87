package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.util.List;

/** Missing-punch queue response — SPEC §4.5.2 P5. */
@Value
@Builder
public class MissingPunchesResponseDto {
    LocalDate date;
    List<MissingPunchItemDto> items;
}
