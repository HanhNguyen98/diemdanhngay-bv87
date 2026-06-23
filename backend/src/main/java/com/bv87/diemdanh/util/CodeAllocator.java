package com.bv87.diemdanh.util;

import com.bv87.diemdanh.repository.DepartmentGroupRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.repository.EmployeeRepository;
import com.bv87.diemdanh.repository.StaffPositionRepository;
import com.bv87.diemdanh.repository.StaffRankRepository;

/**
 * Quy tắc cấp mã:
 * - Đơn vị: max(dept_code) + 1
 * - Nhân viên: max(emp_code trong ban) + 1, hoặc dept*1000+1 nếu ban chưa có ai
 */
public final class CodeAllocator {

    private CodeAllocator() {
    }

    public static int nextDeptCode(DepartmentRepository departmentRepository) {
        return departmentRepository.findMaxDeptCode().orElse(0) + 1;
    }

    public static int nextGroupCode(DepartmentGroupRepository departmentGroupRepository) {
        return departmentGroupRepository.findMaxGroupCode().orElse(0) + 1;
    }

    public static int nextRankCode(StaffRankRepository staffRankRepository) {
        return staffRankRepository.findMaxRankCode().orElse(0) + 1;
    }

    public static int nextPositionCode(StaffPositionRepository staffPositionRepository) {
        return staffPositionRepository.findMaxPositionCode().orElse(0) + 1;
    }

    public static int nextEmpCode(EmployeeRepository employeeRepository, int deptCode) {
        int base = deptCode * 1000;
        return employeeRepository.findMaxEmpCodeByDept(deptCode)
                .map(max -> max + 1)
                .orElse(base + 1);
    }
}
