package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.rankName = :rankName")
    long countByRankName(@Param("rankName") String rankName);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.positionName = :positionName")
    long countByPositionName(@Param("positionName") String positionName);

    @Query("SELECT e.department.deptCode, COUNT(e) FROM Employee e WHERE e.active = true GROUP BY e.department.deptCode")
    List<Object[]> countActiveByDeptCode();

    long countByActiveTrue();

    @Query("SELECT e FROM Employee e JOIN FETCH e.department ORDER BY e.empCode")
    List<Employee> findAllWithDepartment();

    @Query("SELECT MAX(e.empCode) FROM Employee e WHERE e.department.deptCode = :deptCode")
    Optional<Integer> findMaxEmpCodeByDept(@Param("deptCode") Integer deptCode);

    @Query(
            value = """
                    SELECT e FROM Employee e JOIN FETCH e.department d
                    WHERE (:deptCode IS NULL OR d.deptCode = :deptCode)
                    AND (:search IS NULL OR LOWER(e.fullname) LIKE LOWER(CONCAT('%', :search, '%'))
                         OR CONCAT('', e.empCode) LIKE CONCAT('%', :search, '%'))
                    """,
            countQuery = """
                    SELECT COUNT(e) FROM Employee e JOIN e.department d
                    WHERE (:deptCode IS NULL OR d.deptCode = :deptCode)
                    AND (:search IS NULL OR LOWER(e.fullname) LIKE LOWER(CONCAT('%', :search, '%'))
                         OR CONCAT('', e.empCode) LIKE CONCAT('%', :search, '%'))
                    """)
    Page<Employee> searchPage(
            @Param("deptCode") Integer deptCode,
            @Param("search") String search,
            Pageable pageable);
}
