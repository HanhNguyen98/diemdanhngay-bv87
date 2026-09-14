package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Host disk usage for Admin Tổng quan banner (D-DISK.1).
 * {@code level} is {@code ok}, {@code warning}, or {@code danger}.
 */
@Getter
@Builder
public class ServerStorageDto {
    private final String level;
    private final String message;
    private final String drive;
    private final Double freePercent;
    private final Long freeBytes;
    private final Long usedBytes;
    private final Long totalBytes;
    private final String checkedAt;
}
