package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class FingerprintTemplateAuditLogItemDto {
    private final Long id;
    private final Instant createdAt;
    private final String action;
    private final String actionLabel;
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String empFullname;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final String unitCode;
    private final String actorUsername;
    private final String actorRole;
    private final String kioskLabel;
    private final String fingerLabel;
    private final String clientIp;
    private final String note;
}
