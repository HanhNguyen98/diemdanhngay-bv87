package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    @Query("""
            SELECT a FROM Account a
            LEFT JOIN FETCH a.department
            LEFT JOIN FETCH a.employee
            WHERE a.username = :username AND a.active = true
            """)
    Optional<Account> findActiveByUsername(@Param("username") String username);

    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.department LEFT JOIN FETCH a.employee ORDER BY a.username")
    List<Account> findAllWithDepartment();

    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.department LEFT JOIN FETCH a.employee WHERE a.id = :id")
    Optional<Account> findByIdWithDepartment(@Param("id") Long id);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByEmployee_EmpCode(Integer empCode);

    List<Account> findAllByEmployee_EmpCode(Integer empCode);

    @Query("SELECT a FROM Account a JOIN FETCH a.department d WHERE a.role = :role AND a.active = true AND d.deptCode IN :deptCodes")
    List<Account> findActiveByRoleAndDeptCodes(
            @Param("role") AccountRole role,
            @Param("deptCodes") Collection<Integer> deptCodes);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Account a
            WHERE a.role = :role AND a.active = true AND a.department.deptCode = :deptCode
            """)
    boolean existsActiveByRoleAndDeptCode(
            @Param("role") AccountRole role,
            @Param("deptCode") Integer deptCode);

    @Query("""
            SELECT a FROM Account a JOIN FETCH a.department d
            WHERE a.role = :role AND a.active = true AND d.deptCode = :deptCode
            ORDER BY a.id ASC
            """)
    List<Account> findAllActiveByRoleAndDeptCode(
            @Param("role") AccountRole role,
            @Param("deptCode") Integer deptCode);

    @Query("SELECT a FROM Account a WHERE a.role = :role AND a.active = true")
    List<Account> findAllActiveByRole(@Param("role") AccountRole role);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Account a
            WHERE a.role = :role AND a.department.deptCode = :deptCode
            AND (:excludeId IS NULL OR a.id <> :excludeId)
            """)
    boolean existsHeadByDeptCodeExcludingId(
            @Param("role") AccountRole role,
            @Param("deptCode") Integer deptCode,
            @Param("excludeId") Long excludeId);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Account a
            WHERE a.active = true AND a.employee.empCode = :empCode
            AND (:excludeId IS NULL OR a.id <> :excludeId)
            """)
    boolean existsActiveByEmpCodeExcludingId(
            @Param("empCode") Integer empCode,
            @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(a) FROM Account a WHERE a.active = true")
    long countByActiveTrue();

    @Query("SELECT COUNT(a) FROM Account a WHERE a.active = false")
    long countByActiveFalse();

    @Query(
            value = """
                    SELECT a FROM Account a
                    LEFT JOIN FETCH a.department d
                    LEFT JOIN FETCH a.employee e
                    WHERE (:role IS NULL OR a.role = :role)
                    AND (:active IS NULL OR a.active = :active)
                    AND (:search IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%'))
                         OR LOWER(a.fullname) LIKE LOWER(CONCAT('%', :search, '%'))
                         OR (e IS NOT NULL AND CONCAT('', e.empCode) LIKE CONCAT('%', :search, '%'))
                         OR (d IS NOT NULL AND LOWER(d.deptName) LIKE LOWER(CONCAT('%', :search, '%'))))
                    """,
            countQuery = """
                    SELECT COUNT(a) FROM Account a
                    LEFT JOIN a.department d
                    LEFT JOIN a.employee e
                    WHERE (:role IS NULL OR a.role = :role)
                    AND (:active IS NULL OR a.active = :active)
                    AND (:search IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%'))
                         OR LOWER(a.fullname) LIKE LOWER(CONCAT('%', :search, '%'))
                         OR (e IS NOT NULL AND CONCAT('', e.empCode) LIKE CONCAT('%', :search, '%'))
                         OR (d IS NOT NULL AND LOWER(d.deptName) LIKE LOWER(CONCAT('%', :search, '%'))))
                    """)
    Page<Account> searchPage(
            @Param("role") AccountRole role,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable);
}
