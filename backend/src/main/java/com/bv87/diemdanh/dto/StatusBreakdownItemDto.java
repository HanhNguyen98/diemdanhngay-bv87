package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class StatusBreakdownItemDto {
    private final String code;
    private final String label;
    private final String badgeLabel;
    private final String colorKey;
    private final String iconKey;
    private final int sortOrder;
    private final long count;
    private final List<StatusBreakdownItemDto> children;
}
