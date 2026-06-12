package com.bv87.diemdanh.service.ai;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class AiIntent {
    public enum Type {
        GREETING,
        WORK_STATUS_PICKER,
        WORK_STATUS_EXECUTE,
        ATTENDANCE_DATE_PICKER,
        ATTENDANCE_STATUS_EXECUTE,
        PENDING_DEPARTMENTS,
        BATCH_REMINDERS,
        UNKNOWN
    }

    private final Type type;
    private final Map<String, Object> args;
    private final String replyHint;
}
