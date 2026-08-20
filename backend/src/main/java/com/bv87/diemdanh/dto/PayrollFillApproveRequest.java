package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/** Admin approves payroll auto-fill — SPEC P8-NghiTrucWizard. */
@Getter
@Setter
public class PayrollFillApproveRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    private LocalDate date;
}
