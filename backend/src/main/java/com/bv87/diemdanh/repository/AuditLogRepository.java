package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            SELECT a FROM AuditLog a
            WHERE a.createdAt >= :fromAt AND a.createdAt < :toAt
              AND a.action LIKE 'ATTENDANCE%'
              AND (:deptCode IS NULL OR a.deptCode = :deptCode)
              AND (:username IS NULL OR LOWER(a.username) = LOWER(:username))
            """)
    Page<AuditLog> searchAttendanceLogs(
            @Param("fromAt") Instant fromAt,
            @Param("toAt") Instant toAt,
            @Param("deptCode") Integer deptCode,
            @Param("username") String username,
            Pageable pageable);
}
