package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.util.CodeFormatter;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StaffAttendanceDto {
    private final Long recordId;
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String rankName;
    private final String positionName;
    private final String avatarUrl;
    private final String status;
    private final String statusLabel;
    private final String note;

    public static String formatEmp(Integer empCode) {
        return CodeFormatter.formatEmpCode(empCode);
    }
}
