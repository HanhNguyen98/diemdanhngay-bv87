package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class FingerprintScanResultDto {
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final String direction;
    private final String status;
    private final Instant checkInAt;
    private final Instant checkOutAt;
    private final String message;
    private final Integer score;
}
