package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AttendanceHistoryPageDto {
    private final List<AttendanceHistoryItemDto> items;
    private final int page;
    private final int pageSize;
    private final long totalItems;
    private final int totalPages;
}
