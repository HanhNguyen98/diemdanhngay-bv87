package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FingerprintEnrollRequest {

    @NotNull(message = "Mã nhân viên không được để trống")
    private Integer empCode;

    @NotBlank(message = "Template vân tay không được để trống")
    private String templateBase64;

    @NotNull(message = "Độ dài template không được để trống")
    private Integer templateLen;

    private Integer fingerIndex = 0;

    private Integer zkFid;

    /** Required note for which finger was scanned (P2.2). */
    @NotBlank(message = "Vui lòng nhập ghi chú ngón tay (ví dụ: Ngón cái tay phải).")
    @Size(max = 100, message = "Ghi chú ngón tay tối đa 100 ký tự")
    private String fingerLabel;
}
