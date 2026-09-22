package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AccountScreen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AccountScreenRepository extends JpaRepository<AccountScreen, Long> {

    @Query("SELECT s.screenCode FROM AccountScreen s WHERE s.account.id = :accountId ORDER BY s.screenCode")
    List<String> findCodesByAccountId(@Param("accountId") Long accountId);

    boolean existsByAccountId(Long accountId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM AccountScreen s WHERE s.account.id = :accountId")
    void deleteByAccountId(@Param("accountId") Long accountId);
}
