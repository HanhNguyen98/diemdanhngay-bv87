package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/** Preview flags for Admin staff soft-deactivate confirm (D-STAFF.2). */
@Getter
@Builder
public class StaffDeactivatePreviewDto {
    private final Integer empCode;
    private final String empCodeFormatted;
    private final String fullname;
    private final boolean alreadyInactive;
    private final boolean isDepartmentCatalogHead;
    private final String headDepartmentLabel;
    private final boolean hasAttendanceRecords;
    private final List<String> linkedActiveAccountUsernames;
}
