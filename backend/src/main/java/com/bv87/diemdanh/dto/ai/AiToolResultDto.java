package com.bv87.diemdanh.dto.ai;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class AiToolResultDto {
    private final String message;
    private final List<Map<String, Object>> widgets;
}
