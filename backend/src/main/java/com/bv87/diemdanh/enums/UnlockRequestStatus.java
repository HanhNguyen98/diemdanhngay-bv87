package com.bv87.diemdanh.enums;

/**
 * HEAD past-date unlock request lifecycle — SPEC P15 §4.7.2.
 */
public enum UnlockRequestStatus {
    PENDING,
    APPROVED,
    REJECTED;

    public String getLabel() {
        return switch (this) {
            case PENDING -> "Chờ Admin xác nhận";
            case APPROVED -> "Đã mở khóa";
            case REJECTED -> "Đã từ chối";
        };
    }
}
