package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAttendanceRequest {
    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;
    @NotBlank(message = "Trạng thái điểm danh không được để trống")
    private String status;
    private String note;
}
