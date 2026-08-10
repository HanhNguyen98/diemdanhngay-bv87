package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Admin soft-clear day record to unchecked — SPEC §4.11.
 */
@Getter
@Setter
public class ClearAttendanceRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    /** Attendance calendar date (Asia/Ho_Chi_Minh). Default today if null. */
    private LocalDate date;

    @NotBlank(message = "Lý do không được để trống")
    @Size(max = 255, message = "Lý do tối đa 255 ký tự")
    private String reason;
}
