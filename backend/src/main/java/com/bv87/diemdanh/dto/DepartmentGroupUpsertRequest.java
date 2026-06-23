package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentGroupUpsertRequest {
    @NotBlank
    private String groupName;
    private Integer sortOrder;
}
