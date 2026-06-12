package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportBlockRequest {
    @NotNull
    private Integer deptCode;
    private String reason;
}
