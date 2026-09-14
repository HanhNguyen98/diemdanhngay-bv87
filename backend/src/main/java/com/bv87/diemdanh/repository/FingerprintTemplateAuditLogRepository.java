package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.FingerprintTemplateAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface FingerprintTemplateAuditLogRepository extends JpaRepository<FingerprintTemplateAuditLog, Long> {

    @Query("""
            SELECT l FROM FingerprintTemplateAuditLog l
            WHERE l.createdAt >= :fromInstant AND l.createdAt < :toInstant
            AND (:deptCode IS NULL OR l.deptCode = :deptCode)
            ORDER BY l.createdAt DESC
            """)
    Page<FingerprintTemplateAuditLog> search(
            @Param("fromInstant") Instant fromInstant,
            @Param("toInstant") Instant toInstant,
            @Param("deptCode") Integer deptCode,
            Pageable pageable);
}
