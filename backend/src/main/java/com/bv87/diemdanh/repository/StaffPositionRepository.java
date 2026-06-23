package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.StaffPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StaffPositionRepository extends JpaRepository<StaffPosition, Integer> {

    @Query("SELECT MAX(p.positionCode) FROM StaffPosition p")
    Optional<Integer> findMaxPositionCode();

    boolean existsByPositionNameIgnoreCase(String positionName);

    Optional<StaffPosition> findByPositionName(String positionName);

    @Query("SELECT p FROM StaffPosition p ORDER BY p.sortOrder, p.positionCode")
    List<StaffPosition> findAllOrdered();

    @Query("SELECT p FROM StaffPosition p WHERE p.active = true ORDER BY p.sortOrder, p.positionCode")
    List<StaffPosition> findAllActiveOrdered();
}
