package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.FingerprintKioskToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FingerprintKioskTokenRepository extends JpaRepository<FingerprintKioskToken, Long> {

    Optional<FingerprintKioskToken> findByTokenHashAndActiveTrue(String tokenHash);

    boolean existsByTokenHash(String tokenHash);

    List<FingerprintKioskToken> findAllByOrderByDeptCodeAscCreatedAtDesc();

    List<FingerprintKioskToken> findAllByDeptCodeAndActiveTrue(Integer deptCode);
}
