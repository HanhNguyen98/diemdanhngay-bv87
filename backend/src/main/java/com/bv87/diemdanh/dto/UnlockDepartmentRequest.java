package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UnlockDepartmentRequest {
    @NotNull(message = "Mã Đơn vị không được để trống")
    private Integer deptCode;
    @NotBlank(message = "Lý do mở khóa không được để trống")
    private String reason;
}
