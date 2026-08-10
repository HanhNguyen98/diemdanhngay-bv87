package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.EmployeeFingerprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EmployeeFingerprintRepository extends JpaRepository<EmployeeFingerprint, Long> {

    Optional<EmployeeFingerprint> findFirstByEmpCodeAndActiveTrue(Integer empCode);

    boolean existsByEmpCodeAndActiveTrue(Integer empCode);

    @Query("select f.empCode from EmployeeFingerprint f where f.active = true and f.empCode in :empCodes")
    List<Integer> findActiveEmpCodesIn(Collection<Integer> empCodes);

    List<EmployeeFingerprint> findAllByEmpCodeAndActiveTrue(Integer empCode);

    List<EmployeeFingerprint> findAllByActiveTrueAndEmpCodeIn(Collection<Integer> empCodes);

    /**
     * Meta only (no template LOB) for kiosk staff / Web status lists — SPEC §8.3 P4b.
     */
    @Query("""
            select f.empCode as empCode, f.fingerLabel as fingerLabel,
                   f.enrolledAt as enrolledAt, f.enrolledBy as enrolledBy
            from EmployeeFingerprint f
            where f.active = true and f.empCode in :empCodes
            """)
    List<FingerprintMetaView> findActiveMetaByEmpCodes(@Param("empCodes") Collection<Integer> empCodes);

    @Query("""
            select f from EmployeeFingerprint f
            where f.active = true
            and f.empCode in (
              select e.empCode from Employee e
              where e.department.deptCode = :deptCode and e.active = true
            )
            """)
    List<EmployeeFingerprint> findActiveByDeptCode(@Param("deptCode") Integer deptCode);

    /** Projection without MEDIUMTEXT template. */
    interface FingerprintMetaView {
        Integer getEmpCode();
        String getFingerLabel();
        java.time.Instant getEnrolledAt();
        String getEnrolledBy();
    }
}
