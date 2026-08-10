package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

/** One missing-punch / unmarked exception — SPEC §4.5.2 P5. */
@Value
@Builder
public class MissingPunchItemDto {
    Integer empCode;
    String empCodeFormatted;
    String fullName;
    Integer deptCode;
    String deptCodeFormatted;
    String deptName;
    String status;
    String statusLabel;
    Instant checkInAt;
    Instant checkOutAt;
    /** MISSING_CHECK_OUT | UNMARKED */
    String reason;
}
