package com.bv87.diemdanh.enums;

/**
 * Admin payroll time-fill lifecycle — SPEC P8-NghiTrucWizard.
 */
public enum PayrollFillStatus {
    PENDING,
    APPROVED;

    public String getLabel() {
        return switch (this) {
            case PENDING -> "Chờ Admin duyệt giờ";
            case APPROVED -> "Đã duyệt bổ sung giờ";
        };
    }

    public static PayrollFillStatus fromCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        try {
            return PayrollFillStatus.valueOf(code.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
