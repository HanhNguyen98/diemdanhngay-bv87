package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Admin fills empty check-in / check-out slots only — SPEC §4.6.
 */
@Getter
@Setter
public class FillAttendanceTimesRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    /** Attendance calendar date (Asia/Ho_Chi_Minh). Default today if null. */
    private LocalDate date;

    /** Wall-clock HH:mm — only applied when check_in_at is currently null. */
    private String checkInTime;

    /** Wall-clock HH:mm — only applied when check_out_at is currently null. */
    private String checkOutTime;
}
