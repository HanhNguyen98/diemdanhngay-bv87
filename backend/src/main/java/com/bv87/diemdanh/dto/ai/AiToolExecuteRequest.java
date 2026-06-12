package com.bv87.diemdanh.dto.ai;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class AiToolExecuteRequest {
    private String tool;
    private Map<String, Object> params;
}
