package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ScreenCatalogItemDto {
    private final String code;
    private final String navId;
    private final String mode;
    private final String label;
    private final String displayLabel;
    private final String group;
}
