package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/** Generic paginated registry response for admin list endpoints. */
@Getter
@Builder
public class RegistryPageDto<T> {
    private final List<T> items;
    private final int page;
    private final int pageSize;
    private final long totalItems;
    private final int totalPages;
}
