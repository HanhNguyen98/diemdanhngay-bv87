package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.entity.PermissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PermissionGroupRepository extends JpaRepository<PermissionGroup, Long> {

    @Query("""
            SELECT g FROM PermissionGroup g
            WHERE (:role IS NULL OR g.roleScope = :role)
            AND (:activeOnly = false OR g.active = true)
            ORDER BY g.roleScope, g.name
            """)
    List<PermissionGroup> findFiltered(
            @Param("role") AccountRole role,
            @Param("activeOnly") boolean activeOnly);

    @Query("SELECT g FROM PermissionGroup g LEFT JOIN FETCH g.screens WHERE g.id = :id")
    Optional<PermissionGroup> findByIdWithScreens(@Param("id") Long id);

    boolean existsByNameAndRoleScope(String name, AccountRole roleScope);

    boolean existsByNameAndRoleScopeAndIdNot(String name, AccountRole roleScope, Long id);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);
}
