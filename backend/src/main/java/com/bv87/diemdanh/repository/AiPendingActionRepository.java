package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AiPendingAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface AiPendingActionRepository extends JpaRepository<AiPendingAction, String> {

    @Modifying
    @Query("DELETE FROM AiPendingAction a WHERE a.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
