package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
