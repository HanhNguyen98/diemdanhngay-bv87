package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Result of applying a manual status across a date range — SPEC §3.2.1.
 */
@Getter
@Builder
public class ManualAttendanceRangeResultDto {
    private final int updatedCount;
    private final int skippedFingerprint;
    private final int skippedReportSubmitted;
    private final String status;
    private final String statusLabel;
    private final String message;
}
