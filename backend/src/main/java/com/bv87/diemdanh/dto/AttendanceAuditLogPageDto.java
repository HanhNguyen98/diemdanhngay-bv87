package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/** Paginated attendance audit log — SPEC P14. */
@Getter
@Builder
public class AttendanceAuditLogPageDto {
    private final List<AttendanceAuditLogItemDto> items;
    private final int page;
    private final int pageSize;
    private final long totalItems;
    private final int totalPages;
}
