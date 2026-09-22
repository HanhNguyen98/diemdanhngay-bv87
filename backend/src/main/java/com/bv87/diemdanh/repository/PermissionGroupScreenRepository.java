package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.PermissionGroupScreen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PermissionGroupScreenRepository extends JpaRepository<PermissionGroupScreen, Long> {

    @Query("""
            SELECT s.screenCode FROM PermissionGroupScreen s
            WHERE s.group.id = :groupId
            ORDER BY s.screenCode
            """)
    List<String> findCodesByGroupId(@Param("groupId") Long groupId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM PermissionGroupScreen s WHERE s.group.id = :groupId")
    void deleteByGroupId(@Param("groupId") Long groupId);
}
