package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/** Paginated scan logs for one employee on one calendar day (VN). */
@Getter
@Builder
public class ScanLogPageDto {
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final LocalDate date;
    private final List<ScanLogItemDto> items;
    private final int page;
    private final int pageSize;
    private final long totalItems;
    private final int totalPages;
}
