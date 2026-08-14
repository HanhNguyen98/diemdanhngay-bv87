package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** One fingerprint scan log row for Admin/HEAD audit modal (SPEC §10.3). */
@Getter
@Builder
public class ScanLogItemDto {
    private final Instant scannedAt;
    private final String direction;
    private final Integer score;
    private final String message;
    private final String clientHostname;
    private final String clientIp;
    private final String kioskLabel;
}
