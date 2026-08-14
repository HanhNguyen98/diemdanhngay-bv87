package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One department-assignment / transfer event for admin history — SPEC_ADMIN §7.3 P6-Admind.
 */
@Getter
@Builder
public class StaffDepartmentAssignmentDto {
    private final Long id;
    /** Previous department before this period; null when {@link #initial}. */
    private final Integer fromDeptCode;
    private final String fromDeptCodeFormatted;
    private final String fromDeptName;
    /** Department of this assignment period (destination). */
    private final Integer toDeptCode;
    private final String toDeptCodeFormatted;
    private final String toDeptName;
    /** @deprecated use {@link #toDeptCode} — kept for older FE readers */
    private final Integer deptCode;
    /** @deprecated use {@link #toDeptCodeFormatted} */
    private final String deptCodeFormatted;
    /** @deprecated use {@link #toDeptName} */
    private final String deptName;
    private final LocalDate fromDate;
    private final LocalDate toDate;
    private final String reason;
    private final String createdBy;
    private final LocalDateTime createdAt;
    private final boolean current;
    /** True when there was no prior department (created / first assignment). */
    private final boolean initial;
}
