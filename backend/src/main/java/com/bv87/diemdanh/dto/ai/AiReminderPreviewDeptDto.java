package com.bv87.diemdanh.dto.ai;

import lombok.Builder;
import lombok.Getter;

/** Admin AI reminder preview row — missing-punch aggregates (SPEC_AI_ASSISTANT). */
@Getter
@Builder
public class AiReminderPreviewDeptDto {
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    /** Total missing-punch / unmarked items for the target date. */
    private final long missingCount;
    private final long missingCheckoutCount;
    private final long unmarkedCount;
}
