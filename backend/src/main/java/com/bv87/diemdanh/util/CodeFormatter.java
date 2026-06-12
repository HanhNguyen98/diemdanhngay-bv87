package com.bv87.diemdanh.util;

/**
 * Formats integer department and employee codes for display.
 * Database stores raw INT values; padding is applied only at the presentation layer.
 */
public final class CodeFormatter {

    private CodeFormatter() {
    }

    /** @return zero-padded department code, e.g. 1 → "01" */
    public static String formatDeptCode(Integer deptCode) {
        if (deptCode == null) {
            return null;
        }
        return String.format("%02d", deptCode);
    }

    /** @return zero-padded employee code, e.g. 1001 → "01001" */
    public static String formatEmpCode(Integer empCode) {
        if (empCode == null) {
            return null;
        }
        return String.format("%05d", empCode);
    }
}
