package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {

    @Query("SELECT d FROM Department d JOIN FETCH d.departmentGroup ORDER BY d.deptCode")
    List<Department> findAllWithGroup();

    @Query("SELECT MAX(d.deptCode) FROM Department d")
    Optional<Integer> findMaxDeptCode();

    boolean existsByHeadEmpCode(Integer headEmpCode);

    Optional<Department> findByHeadEmpCode(Integer headEmpCode);

    @Query("SELECT d FROM Department d JOIN FETCH d.departmentGroup WHERE d.deptCode = :deptCode")
    Optional<Department> findByIdWithGroup(@Param("deptCode") Integer deptCode);

    long countByDepartmentGroup_GroupCodeAndActiveTrue(Integer groupCode);
}
