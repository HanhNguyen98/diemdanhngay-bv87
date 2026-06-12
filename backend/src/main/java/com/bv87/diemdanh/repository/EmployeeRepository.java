package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Integer> {

    @Query("SELECT e FROM Employee e JOIN FETCH e.department WHERE e.department.deptCode = :deptCode ORDER BY e.empCode")
    List<Employee> findByDeptCode(@Param("deptCode") Integer deptCode);

    @Query("SELECT e FROM Employee e JOIN FETCH e.department WHERE e.empCode = :empCode")
    java.util.Optional<Employee> findByEmpCodeWithDept(@Param("empCode") Integer empCode);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.deptCode = :deptCode")
    long countByDeptCode(@Param("deptCode") Integer deptCode);

    @Query("SELECT e.department.deptCode, COUNT(e) FROM Employee e WHERE e.active = true GROUP BY e.department.deptCode")
    List<Object[]> countActiveByDeptCode();

    long countByActiveTrue();

    @Query("SELECT e FROM Employee e JOIN FETCH e.department ORDER BY e.empCode")
    List<Employee> findAllWithDepartment();

    @Query("SELECT MAX(e.empCode) FROM Employee e WHERE e.department.deptCode = :deptCode")
    Optional<Integer> findMaxEmpCodeByDept(@Param("deptCode") Integer deptCode);
}
