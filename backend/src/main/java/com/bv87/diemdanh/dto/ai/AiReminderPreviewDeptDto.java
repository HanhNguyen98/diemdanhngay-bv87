package com.bv87.diemdanh.dto.ai;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiReminderPreviewDeptDto {
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final long markedCount;
    private final long total;
    private final int progressPercent;
}
