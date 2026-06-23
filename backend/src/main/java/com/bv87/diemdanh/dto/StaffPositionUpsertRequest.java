package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StaffPositionUpsertRequest {
    @NotBlank
    private String positionName;
    private Integer sortOrder;
    private Boolean active;
}
