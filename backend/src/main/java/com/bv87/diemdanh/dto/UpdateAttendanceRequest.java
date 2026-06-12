package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAttendanceRequest {
    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;
    @NotNull(message = "Trạng thái điểm danh không được để trống")
    private AttendanceStatus status;
    private String note;
}
