package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {

    @Query("SELECT MAX(d.deptCode) FROM Department d")
    Optional<Integer> findMaxDeptCode();

    boolean existsByHeadEmpCode(Integer headEmpCode);
}
