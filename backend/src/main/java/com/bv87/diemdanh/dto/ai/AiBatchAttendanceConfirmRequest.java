package com.bv87.diemdanh.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiBatchAttendanceConfirmRequest {

    @NotBlank
    private String actionId;
}
