package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/** Preview conflicts for manual date-range assign — SPEC §3.2.1. */
@Getter
@Setter
public class ManualAttendanceRangePreviewRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate fromDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate toDate;

    /** Target status — fingerprint skip is waived for NGHI_TRUC_* (§4.8 / §4.13.4). */
    private String status;
}
