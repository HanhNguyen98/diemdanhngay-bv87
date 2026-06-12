package com.bv87.diemdanh.service.ai.head;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class HeadAiIntent {

    public enum Type {
        GREETING,
        STATUS_PICKER,
        BATCH_ATTENDANCE_EXECUTE,
        UNKNOWN
    }

    private final Type type;
    private final Map<String, Object> args;
    private final String replyHint;
}
