package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KioskTemplateDto {
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final Integer zkFid;
    private final String templateBase64;
    private final int templateLen;
}
