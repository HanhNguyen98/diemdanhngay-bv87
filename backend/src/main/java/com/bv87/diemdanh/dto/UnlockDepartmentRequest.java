package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UnlockDepartmentRequest {
    @NotNull(message = "Mã Đơn vị không được để trống")
    private Integer deptCode;
    @NotBlank(message = "Lý do mở khóa không được để trống")
    private String reason;
    /** Attendance date to unlock; omit = today. Must not be in the future. */
    private LocalDate date;
}
