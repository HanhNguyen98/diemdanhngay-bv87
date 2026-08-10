package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class FingerprintStatusDto {
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final boolean registered;
    private final Instant enrolledAt;
    private final String enrolledBy;
    /** Active template finger note (P2.2); null when not registered. */
    private final String fingerLabel;
}
