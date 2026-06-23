package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.DepartmentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface DepartmentGroupRepository extends JpaRepository<DepartmentGroup, Integer> {

    @Query("SELECT MAX(g.groupCode) FROM DepartmentGroup g")
    Optional<Integer> findMaxGroupCode();
}
