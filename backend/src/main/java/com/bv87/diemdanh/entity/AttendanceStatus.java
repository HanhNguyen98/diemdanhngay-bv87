package com.bv87.diemdanh.entity;

/**
 * Daily attendance status for an employee.
 * Vietnamese labels are exposed via {@link #getLabel()} for API/UI consumption.
 */
public enum AttendanceStatus {

    DI_LAM("Đi làm"),
    DI_TRE("Đi trễ"),
    NGHI_PHEP("Nghỉ phép"),
    DI_HOC("Đi học"),
    DI_CONG_TAC("Đi công tác"),
    THAI_SAN("Thai sản"),
    VE_SOM("Về sớm"),
    NGHI_TRUC("Nghỉ trực"),
    NGHI_TRUC_FULL("Nghỉ trực 1 ngày"),
    NGHI_TRUC_HALF("Nghỉ trực nửa ngày");

    private final String label;

    AttendanceStatus(String label) {
        this.label = label;
    }

    /** Vietnamese display label for end users. */
    public String getLabel() {
        return label;
    }
}
