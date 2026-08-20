package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

/** Preview counts before applying manual range — SPEC §3.2.1. */
@Getter
@Builder
public class ManualAttendanceRangePreviewDto {
    private final int totalDays;
    private final int assignableCount;
    private final int skippedFingerprint;
    private final int skippedReportSubmitted;
    private final int skippedSoftLock;
    /** True when caller is HEAD and fingerprint days would be skipped (show confirm). */
    private final boolean requiresFingerprintSkipConfirm;
    private final String message;
}
