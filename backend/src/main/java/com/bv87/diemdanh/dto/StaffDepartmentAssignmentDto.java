package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One row of employee department assignment history for admin UI. */
@Getter
@Builder
public class StaffDepartmentAssignmentDto {
    private final Long id;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final LocalDate fromDate;
    private final LocalDate toDate;
    private final String reason;
    private final String createdBy;
    private final LocalDateTime createdAt;
    private final boolean current;
}
