package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Request to issue a new kiosk token for one department (ADMIN).
 */
@Getter
@Setter
public class KioskTokenCreateRequest {

    @NotNull(message = "Mã đơn vị không được để trống")
    private Integer deptCode;

    /** Optional display label for the kiosk PC */
    private String label;
}
