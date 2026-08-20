package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.enums.UnlockRequestStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One HEAD unlock request — SPEC P15. */
@Getter
@Builder
public class UnlockRequestItemDto {
    private final Long id;
    private final LocalDate attendanceDate;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final String reason;
    private final UnlockRequestStatus status;
    private final String statusLabel;
    private final String requestedBy;
    private final LocalDateTime requestedAt;
    private final String reviewedBy;
    private final LocalDateTime reviewedAt;
    private final String reviewNote;
}
