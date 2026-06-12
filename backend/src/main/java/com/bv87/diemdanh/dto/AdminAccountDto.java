package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.AccountRole;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminAccountDto {
    private final Long id;
    private final String username;
    private final String fullname;
    private final AccountRole role;
    private final String roleLabel;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final Integer empCode;
    private final String empCodeFormatted;
    private final boolean active;
}
