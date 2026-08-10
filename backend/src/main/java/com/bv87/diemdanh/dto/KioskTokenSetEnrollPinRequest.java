package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

/**
 * Admin request to set enroll PIN on an active kiosk token (SPEC §10.1 P2.1e).
 */
@Getter
@Setter
public class KioskTokenSetEnrollPinRequest {

    @NotBlank(message = "PIN đăng ký không được để trống")
    @Pattern(regexp = "^\\d{4,8}$", message = "PIN đăng ký phải gồm 4–8 chữ số")
    private String enrollPin;
}
