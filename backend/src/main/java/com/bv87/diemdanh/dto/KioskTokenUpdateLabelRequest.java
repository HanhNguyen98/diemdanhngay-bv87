package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Admin request to rename an active kiosk token label (SPEC §10.1 P1.2d).
 */
@Getter
@Setter
public class KioskTokenUpdateLabelRequest {

    @NotBlank(message = "Nhãn kiosk không được để trống")
    @Size(max = 100, message = "Nhãn kiosk tối đa 100 ký tự")
    private String label;
}
