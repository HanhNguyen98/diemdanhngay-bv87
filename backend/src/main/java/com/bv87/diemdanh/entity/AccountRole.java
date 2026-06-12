package com.bv87.diemdanh.entity;

/**
 * Application login role. Used for authorization checks in services and security layer.
 */
public enum AccountRole {

    ADMIN("Quản trị viên"),
    HEAD("TRƯỞNG Đơn vị");

    private final String label;

    AccountRole(String label) {
        this.label = label;
    }

    /** Vietnamese display label for end users. */
    public String getLabel() {
        return label;
    }
}
