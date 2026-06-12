package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SendReminderRequest {

    @NotEmpty
    private List<Integer> deptCodes;
}
