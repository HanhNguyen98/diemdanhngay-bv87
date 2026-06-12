package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ReminderHistoryItemDto {
    private final Long id;
    private final LocalDate attendanceDate;
    private final Integer deptCode;
    private final String deptName;
    private final String triggerType;
    private final String status;
    private final LocalDateTime createdAt;
}
