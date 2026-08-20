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
    /** Days skipped because soft-lock / reportBlocked on today (HEAD) — P6-LockSync */
    private final int skippedSoftLock;
    private final String status;
    private final String statusLabel;
    private final String message;
}
