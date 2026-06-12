package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SendReminderResultDto {
    private final int sent;
    private final int skippedNoHead;
    private final String message;
    private final List<String> skippedDeptNames;
}
