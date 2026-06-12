package com.bv87.diemdanh.dto;

import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DepartmentDto {
    private final Integer deptCode;
    private final String deptCodeFormatted;
    private final String deptName;
    private final boolean locked;
    private final boolean unlocked;
    private final boolean editable;

    public static DepartmentDto from(Department dept, boolean locked, boolean unlocked, boolean editable) {
        return DepartmentDto.builder()
                .deptCode(dept.getDeptCode())
                .deptCodeFormatted(CodeFormatter.formatDeptCode(dept.getDeptCode()))
                .deptName(dept.getDeptName())
                .locked(locked)
                .unlocked(unlocked)
                .editable(editable)
                .build();
    }
}
