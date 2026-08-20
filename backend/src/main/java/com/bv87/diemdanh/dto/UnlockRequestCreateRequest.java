package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UnlockRequestCreateRequest {
    @NotNull(message = "Ngày công không được để trống")
    private LocalDate date;
    @NotBlank(message = "Lý do mở khóa không được để trống")
    private String reason;
}
