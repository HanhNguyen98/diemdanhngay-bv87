package com.bv87.diemdanh.util;

import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.repository.EmployeeRepository;

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

    public static int nextEmpCode(EmployeeRepository employeeRepository, int deptCode) {
        int base = deptCode * 1000;
        return employeeRepository.findMaxEmpCodeByDept(deptCode)
                .map(max -> max + 1)
                .orElse(base + 1);
    }
}
