package com.bv87.diemdanh.dto.ai;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiChatRequest {
    private String message;
    /** quick_action: export_report | batch_reminders | analyze_leaves */
    private String quickAction;
}
