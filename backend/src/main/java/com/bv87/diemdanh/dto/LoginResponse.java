package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    private final Long accountId;
    private final String username;
    private final String fullname;
    private final AccountRole role;
    private final String roleLabel;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final boolean editable;
    private final boolean locked;
    private final String lockMessage;

    public static LoginResponse from(Account account, boolean editable, boolean locked, String lockMessage) {
        return LoginResponse.builder()
                .accountId(account.getId())
                .username(account.getUsername())
                .fullname(account.getFullname())
                .role(account.getRole())
                .roleLabel(account.getRole().getLabel())
                .deptCode(account.getDeptCode())
                .deptCodeFormatted(CodeFormatter.formatDeptCode(account.getDeptCode()))
                .deptName(account.getDepartment() != null ? account.getDepartment().getDeptName() : null)
                .editable(editable)
                .locked(locked)
                .lockMessage(lockMessage)
                .build();
    }
}
