package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.EmployeeDepartmentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeDepartmentAssignmentRepository extends JpaRepository<EmployeeDepartmentAssignment, Long> {

    Optional<EmployeeDepartmentAssignment> findFirstByEmpCodeAndToDateIsNullOrderByFromDateDesc(Integer empCode);

    List<EmployeeDepartmentAssignment> findByEmpCodeOrderByFromDateDescIdDesc(Integer empCode);

    void deleteByEmpCode(Integer empCode);
}
