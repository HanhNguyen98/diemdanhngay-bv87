package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.AttendanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class AttendanceHistoryItemDto {
    private final Long recordId;
    private final LocalDate attendanceDate;
    private final String attendanceDateFormatted;
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final String avatarUrl;
    private final AttendanceStatus status;
    private final String statusLabel;
    private final String note;
}
