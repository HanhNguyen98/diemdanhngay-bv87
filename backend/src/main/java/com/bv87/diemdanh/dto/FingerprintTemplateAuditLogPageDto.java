package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FingerprintTemplateAuditLogPageDto {
    private final List<FingerprintTemplateAuditLogItemDto> items;
    private final int page;
    private final int pageSize;
    private final long totalItems;
    private final int totalPages;
}
