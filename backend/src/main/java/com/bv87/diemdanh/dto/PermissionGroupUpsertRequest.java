package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.AccountRole;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PermissionGroupUpsertRequest {
    @NotBlank
    private String name;
    /** Optional legacy; server always infers from screenCodes */
    private AccountRole roleScope;
    private List<String> screenCodes;
    private Boolean active;
}
