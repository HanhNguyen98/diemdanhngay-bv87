package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DesktopRefreshRequest {
    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;
}
