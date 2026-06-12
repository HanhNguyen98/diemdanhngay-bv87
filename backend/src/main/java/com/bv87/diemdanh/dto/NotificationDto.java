package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationDto {
    private final Long id;
    private final NotificationType type;
    private final String title;
    private final String body;
    private final Integer deptCode;
    private final LocalDate attendanceDate;
    private final boolean read;
    private final LocalDateTime createdAt;
}
