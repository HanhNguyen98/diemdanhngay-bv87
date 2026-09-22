package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.AccountRole;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountUpsertRequest {
    @NotBlank
    private String username;
    /** Bắt buộc khi tạo mới; để trống khi cập nhật nếu không đổi mật khẩu */
    private String password;
    @NotBlank
    private String fullname;
    /** Optional — server sets from permission group (SPEC_DUTY §7.1) */
    private AccountRole role;
    private Integer deptCode;
    private Integer empCode;
    private Boolean active;
    /** Required except bootstrap admin account */
    private Long permissionGroupId;
}
