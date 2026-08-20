package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.CompletionStatus;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class AttendanceSummaryDto {
    private final LocalDate attendanceDate;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    /** UI display name: if unitCode exists, remove trailing "(unitCode)" suffix from deptName. */
    private final String deptNameDisplay;
    private final String unitCode;
    private final long total;
    private final List<StatusBreakdownItemDto> statusBreakdown;
    private final boolean locked;
    private final boolean unlocked;
    private final boolean editable;
    private final String lockTime;
    private final String lockMessage;
    private final long markedCount;
    private final long uncheckedCount;
    private final int progressPercent;
    private final CompletionStatus completionStatus;
    private final boolean reportSubmitted;
    private final boolean reportBlocked;
    private final boolean manualLocked;
    /** Active HEAD login account exists for this department (required for reminders). */
    private final boolean hasActiveHeadAccount;
    private final Long unlockRequestId;
    private final String unlockRequestStatus;
    private final String unlockRequestReason;

    public static String formatDept(Integer deptCode) {
        return CodeFormatter.formatDeptCode(deptCode);
    }
}
