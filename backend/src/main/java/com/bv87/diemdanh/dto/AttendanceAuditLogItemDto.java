package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;

/** One web attendance audit row — SPEC P14. */
@Getter
@Builder
public class AttendanceAuditLogItemDto {
    private final Long id;
    private final Instant createdAt;
    private final String username;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final Integer empCode;
    private final String empCodeFormatted;
    private final LocalDate attendanceDate;
    private final String action;
    private final String actionLabel;
    private final String clientIp;
    private final String userAgent;
    private final String detailsJson;
}
