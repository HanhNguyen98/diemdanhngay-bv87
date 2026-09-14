package com.bv87.diemdanh.enums;

import com.bv87.diemdanh.util.AttendanceValidity;

/**
 * HEAD payroll intent when explaining missing punches — SPEC P7-NghiTrucExplainGate.
 */
public enum PayrollIntent {
    HALF_MORNING,
    HALF_AFTERNOON,
    NGHI_TRUC_FULL,
    EXPLAIN_ONLY;

    public String getLabel() {
        return switch (this) {
            case HALF_MORNING -> "Nghỉ trực nửa buổi sáng";
            case HALF_AFTERNOON -> "Nghỉ trực nửa buổi chiều";
            case NGHI_TRUC_FULL -> "Nghỉ trực 1 ngày";
            case EXPLAIN_ONLY -> "Chờ Admin bổ sung giờ";
        };
    }

    /** Roster subtitle under NGHỈ TRỰC badge — SPEC P16. */
    public String getRosterSubtitle() {
        return switch (this) {
            case HALF_MORNING -> "Nửa buổi sáng";
            case HALF_AFTERNOON -> "Nửa buổi chiều";
            case NGHI_TRUC_FULL -> "1 ngày";
            case EXPLAIN_ONLY -> null;
        };
    }

    public static PayrollIntent fromCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        try {
            return PayrollIntent.valueOf(code.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    public boolean defersPresenceStatus() {
        return this == HALF_MORNING || this == HALF_AFTERNOON || this == NGHI_TRUC_FULL;
    }

    /** Catalog attendance status code for this intent. */
    public String targetStatusCode() {
        return switch (this) {
            case HALF_MORNING, HALF_AFTERNOON -> AttendanceValidity.NGHI_TRUC_HALF;
            case NGHI_TRUC_FULL -> AttendanceValidity.NGHI_TRUC_FULL;
            case EXPLAIN_ONLY -> null;
        };
    }

    public boolean isNghiTrucAssignable() {
        return this == HALF_AFTERNOON || this == NGHI_TRUC_FULL;
    }
}
