package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NextCodeDto {
    private final Integer code;
    private final String codeFormatted;
}
