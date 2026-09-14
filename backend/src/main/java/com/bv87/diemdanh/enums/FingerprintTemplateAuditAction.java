package com.bv87.diemdanh.enums;

/**
 * Audit actions for fingerprint template CRUD (enroll / delete) — SPEC P-HeadFpReset.
 */
public enum FingerprintTemplateAuditAction {
    ENROLL_KIOSK,
    ENROLL_ADMIN,
    ENROLL_HEAD,
    DELETE_KIOSK,
    DELETE_HEAD,
    DELETE_ADMIN;

    /** Vietnamese label for admin audit UI. */
    public String getLabel() {
        return switch (this) {
            case ENROLL_KIOSK -> "Đăng ký vân tay (Agent)";
            case ENROLL_ADMIN -> "Đăng ký vân tay (Admin)";
            case ENROLL_HEAD -> "Đăng ký vân tay (Trưởng đơn vị)";
            case DELETE_KIOSK -> "Xóa vân tay (Agent)";
            case DELETE_HEAD -> "Xóa vân tay (Trưởng đơn vị)";
            case DELETE_ADMIN -> "Xóa vân tay (Admin)";
        };
    }
}
