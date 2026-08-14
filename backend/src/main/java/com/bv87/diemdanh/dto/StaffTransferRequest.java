package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Admin-only department transfer — SPEC_ADMIN §7.3 P6-Adminc.
 * Does not change name, rank, position, active, or avatar.
 */
@Getter
@Setter
public class StaffTransferRequest {

    @NotNull(message = "Đơn vị đích không được để trống")
    private Integer deptCode;

    @NotBlank(message = "Vui lòng nhập lý do luân chuyển Đơn vị")
    private String transferReason;

    /** Required true when employee is HEAD of the current department. */
    private Boolean revokeHeadOnTransfer;
}
