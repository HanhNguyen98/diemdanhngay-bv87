package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Admin fills empty 4-phase slots only — SPEC §4.6 / §4.13.
 */
@Getter
@Setter
public class FillAttendanceTimesRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    /** Attendance calendar date (Asia/Ho_Chi_Minh). Default today if null. */
    private LocalDate date;

    /** Wall-clock HH:mm — empty {@code morning_in_at} only. */
    private String morningInTime;

    /** Wall-clock HH:mm — empty {@code noon_out_at} only. */
    private String noonOutTime;

    /** Wall-clock HH:mm — empty {@code afternoon_in_at} only. */
    private String afternoonInTime;

    /** Wall-clock HH:mm — empty {@code afternoon_out_at} only. */
    private String afternoonOutTime;

    /** Alias for {@link #morningInTime} (pre-P7 clients). */
    private String checkInTime;

    /** Alias for {@link #afternoonOutTime} (pre-P7 clients). */
    private String checkOutTime;
}
