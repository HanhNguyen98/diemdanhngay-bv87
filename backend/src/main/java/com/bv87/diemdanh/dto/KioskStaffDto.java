package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KioskStaffDto {
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final boolean fingerprintRegistered;
    /** Active template finger note when registered (P2.2). */
    private final String fingerLabel;
    private final boolean active;
}
