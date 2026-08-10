package com.bv87.diemdanh.dto.ai;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiChatRequest {
    private String message;
    /** quick_action id from FE chips */
    private String quickAction;
    /** Optional attendance date (ISO) — HEAD uses selected day on the page. */
    private String date;
}
