package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * HEAD/Admin manual status over a date range — SPEC_FINGERPRINT §3.2.1.
 */
@Getter
@Setter
public class ManualAttendanceRangeRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    @NotBlank(message = "Trạng thái Chấm công không được để trống")
    private String status;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate fromDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate toDate;

    private String note;
}
