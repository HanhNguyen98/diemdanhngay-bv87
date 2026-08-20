package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.util.CodeFormatter;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class StaffAttendanceDto {
    private final Long recordId;
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String rankName;
    private final String positionName;
    private final String avatarUrl;
    private final String status;
    private final String statusLabel;
    private final String note;
    /** HEAD missing-punch explanation — SPEC P7 (not VE_SOM / clear reason). */
    private final String missingPunchReason;
    /** HALF_MORNING | HALF_AFTERNOON | NGHI_TRUC_FULL | EXPLAIN_ONLY */
    private final String payrollIntent;
    private final String payrollIntentLabel;
    /** PENDING | APPROVED — P8 payroll auto-fill */
    private final String payrollFillStatus;
    private final String payrollFillStatusLabel;
    /** Effective check-in (rule C); null if not set. Alias of morningInAt. */
    private final Instant checkInAt;
    /** Effective check-out (MAX OUT); null if not set. Alias of afternoonOutAt or noonOutAt. */
    private final Instant checkOutAt;
    private final Instant morningInAt;
    private final Instant noonOutAt;
    private final Instant afternoonInAt;
    private final Instant afternoonOutAt;
    /** Audit flag: morning IN after lateCutoff when status is VE_SOM (SPEC §4.13). */
    private final boolean lateFlag;
    private final String lastKioskHostname;
    private final String lastKioskIp;
    private final Integer lastKioskDeptCode;
    private final String lastKioskLabel;
    /** FINGERPRINT | MANUAL | ADMIN | MIXED — null when no day record. */
    private final String source;

    public static String formatEmp(Integer empCode) {
        return CodeFormatter.formatEmpCode(empCode);
    }
}
