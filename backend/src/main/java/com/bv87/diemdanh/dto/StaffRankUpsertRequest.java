package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StaffRankUpsertRequest {
    @NotBlank
    private String rankName;
    private Integer sortOrder;
    private Boolean active;
}
