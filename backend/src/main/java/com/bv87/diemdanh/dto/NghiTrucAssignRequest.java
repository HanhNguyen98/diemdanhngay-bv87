package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/** HEAD wizard — giải trình + chấm nghỉ trực — SPEC P8-NghiTrucWizard. */
@Getter
@Setter
public class NghiTrucAssignRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    @NotNull(message = "Từ ngày không được để trống")
    private LocalDate fromDate;

    @NotNull(message = "Đến ngày không được để trống")
    private LocalDate toDate;

    @NotBlank(message = "Vui lòng nhập lý do thiếu giờ")
    @Size(max = 255, message = "Lý do tối đa 255 ký tự")
    private String reason;

    /** HALF_MORNING | HALF_AFTERNOON | NGHI_TRUC_FULL */
    @NotBlank(message = "Vui lòng chọn loại nghỉ trực")
    private String payrollIntent;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String note;
}
