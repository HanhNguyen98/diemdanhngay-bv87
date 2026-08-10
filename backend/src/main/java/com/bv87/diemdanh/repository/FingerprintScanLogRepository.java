package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.FingerprintScanLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface FingerprintScanLogRepository extends JpaRepository<FingerprintScanLog, Long> {

    Page<FingerprintScanLog> findByEmpCodeAndScannedAtGreaterThanEqualAndScannedAtLessThanOrderByScannedAtAsc(
            Integer empCode, Instant fromInclusive, Instant toExclusive, Pageable pageable);
}
