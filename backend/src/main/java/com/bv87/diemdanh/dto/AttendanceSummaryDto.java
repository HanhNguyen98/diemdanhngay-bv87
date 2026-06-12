package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.CompletionStatus;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class AttendanceSummaryDto {
    private final LocalDate attendanceDate;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final long total;
    private final long diLam;
    private final long nghiPhep;
    private final long diHoc;
    private final long diCongTac;
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

    public static String formatDept(Integer deptCode) {
        return CodeFormatter.formatDeptCode(deptCode);
    }
}
