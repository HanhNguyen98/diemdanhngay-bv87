package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AttendanceUnlockRequest;
import com.bv87.diemdanh.enums.UnlockRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceUnlockRequestRepository extends JpaRepository<AttendanceUnlockRequest, Long> {

    @Query("""
            SELECT r FROM AttendanceUnlockRequest r
            JOIN FETCH r.department
            WHERE r.id = :id
            """)
    Optional<AttendanceUnlockRequest> findWithDeptById(@Param("id") Long id);

    @Query("""
            SELECT r FROM AttendanceUnlockRequest r
            JOIN FETCH r.department
            WHERE r.department.deptCode = :deptCode
              AND r.attendanceDate = :date
              AND r.status = :status
            """)
    Optional<AttendanceUnlockRequest> findByDeptDateAndStatus(
            @Param("deptCode") Integer deptCode,
            @Param("date") LocalDate date,
            @Param("status") UnlockRequestStatus status);

    @Query("""
            SELECT r FROM AttendanceUnlockRequest r
            JOIN FETCH r.department
            WHERE r.department.deptCode = :deptCode AND r.attendanceDate = :date
            ORDER BY r.requestedAt DESC
            """)
    List<AttendanceUnlockRequest> findByDeptAndDateOrderByRequestedAtDesc(
            @Param("deptCode") Integer deptCode,
            @Param("date") LocalDate date);

    @Query("""
            SELECT r FROM AttendanceUnlockRequest r
            JOIN FETCH r.department
            WHERE (:status IS NULL OR r.status = :status)
            ORDER BY r.requestedAt DESC
            """)
    List<AttendanceUnlockRequest> search(@Param("status") UnlockRequestStatus status);

    long countByStatus(UnlockRequestStatus status);
}
