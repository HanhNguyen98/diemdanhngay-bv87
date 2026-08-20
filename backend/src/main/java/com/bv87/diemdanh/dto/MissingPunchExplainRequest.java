package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/** HEAD explains missing punches — SPEC P7-NghiTrucExplainGate. */
@Getter
@Setter
public class MissingPunchExplainRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    private LocalDate date;

    @NotBlank(message = "Vui lòng nhập lý do thiếu giờ")
    @Size(max = 255, message = "Lý do tối đa 255 ký tự")
    private String reason;

    /** HALF_MORNING | HALF_AFTERNOON | NGHI_TRUC_FULL | EXPLAIN_ONLY */
    @NotBlank(message = "Vui lòng chọn hướng xử lý")
    private String payrollIntent;
}
