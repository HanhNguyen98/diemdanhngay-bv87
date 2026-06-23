package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.StaffRank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface StaffRankRepository extends JpaRepository<StaffRank, Integer> {

    @Query("SELECT MAX(r.rankCode) FROM StaffRank r")
    Optional<Integer> findMaxRankCode();

    boolean existsByRankNameIgnoreCase(String rankName);

    Optional<StaffRank> findByRankName(String rankName);

    @Query("SELECT r FROM StaffRank r ORDER BY r.sortOrder, r.rankCode")
    List<StaffRank> findAllOrdered();

    @Query("SELECT r FROM StaffRank r WHERE r.active = true ORDER BY r.sortOrder, r.rankCode")
    List<StaffRank> findAllActiveOrdered();
}
